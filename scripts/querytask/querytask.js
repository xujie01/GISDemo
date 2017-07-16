/*
 =====组件说明=====
 组件在main.js内被调用
 当页面loaded的时候，会执行构造函数constructor
 当map被创建之后，会执行startup

 组件对应一个dom根节点，此dom节点相关的事件绑定在bindDomEvents函数中进行
 -------------------------------------------------------------------------------------
 组件必须在main.js内被调用才能被初始化，其中：
 main.js的构造函数中执行组件的构造函数
 mian.js的initComponents函数中执行组件的startup函数

 */

//Field1 like '%乡%' and OBJECTID<>10
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/text!querytask/tmpl/querytask.html",
    "dojo/text!querytask/tmpl/queryRule.html",
    "dojo/text!querytask/tmpl/queryResult.html",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/graphic",
    "esri/toolbars/draw"
], function (
    declare,
    lang,
    Query,
    QueryTask,
    querytasktmpl,
    queryRuletmpl,
    queryResulttmpl,
    SimpleFillSymbol,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    Graphic,
    Draw
){
    return declare(null, {
        app: null,
        constructor: function( app ){
            this.app = app;
            this.bindDomEvents();
        },

        bindDomEvents: function(){
            //删除规则
            $("#queryTaskDiv").delegate("[node-type=removeRole]", "click", $.proxy(function(e){
                $(e.currentTarget).parents(".well").remove();
            }, this) );

            //添加规则
            $("#queryTaskDiv").delegate("[node-type=addRole]", "click", $.proxy(function(e){
                $("[node-type=rulesBox]").append( $("[node-type=ruleItemTmpl]").children().clone());
                $("[node-type=rulesBox]").children().css({display:'block'});
            }, this) );

            //图层改变
            $("#queryTaskDiv").delegate("[node-type=findLayerSelect]", "change", $.proxy(function(e){
                this.refreshRulesDivByLayer();
            }, this) );

            //执行查询
            $("#queryTaskDiv").delegate("[node-type=find]", "click", $.proxy(function(e){
                this.executeFind();
            }, this) );

            //绘制查询的几何图形
            $("#queryTaskDiv").delegate("[node-type=geomertyRule]", "click", $.proxy(function(e){
                $("#queryTaskDiv [node-type=queryResult]").html("");
                this.app.resultLayer.clear();
                this.app.tempLayer.clear();
                var tool = $(e.currentTarget).text().toUpperCase().replace(/ /g, "");
                if(tool != "清空"){
                    this.toolbar.activate(Draw[tool]);
                }else{
                    this.app.tempLayer.clear();
                    if(this.editToolbar){
                        this.editToolbar.deactivate();
                    }
                }
            }, this) );
        },

        startup: function () {
            var _html = baidu.template(querytasktmpl, this.app.config);
            $("#queryTaskDiv").html( _html );
            //填充图层下拉框之后，就根据图层展示规则相关内容，主要是字段信息
            this.refreshRulesDivByLayer();
            this.initDrawTools();
        },

        initDrawTools:function(){
            this.toolbar = new Draw(this.app.map);
            this.toolbar.on("draw-end",  $.proxy(function(evt){
                this.toolbar.deactivate();
                var symbol = new SimpleFillSymbol();
                var graphic = new Graphic(evt.geometry, symbol);
                this.app.tempLayer.add(graphic);
            },this));
        },

        //根据所选图层展示规则相关
        refreshRulesDivByLayer: function(){
            var _url = $("#queryTaskDiv [node-type=findLayerSelect]").val();
            $.ajax({
                data:{
                    f:"json"
                },
                type: "GET",
                url: _url,
                dataType: "jsonp"
            }).then(function(res){
                var _html = baidu.template(queryRuletmpl, res );
                $("#queryTaskDiv [node-type=rulesAboutDiv]").html( _html );
            });

        },

        executeFind: function(){
            $("#queryTaskDiv [node-type=queryResult]").html("");
            this.app.resultLayer.clear();

            var query = new Query();
            query.returnGeometry = true;
            query.outSpatialReference = this.app.map.spatialReference;
            query.outFields = ["*"];

            var where = this.getRules();
            if(where != ""){
                query.where = this.getRules();
            }
            var graphics = this.app.tempLayer.graphics ;
            if(graphics.length  >  0){
                query.geometry = graphics[0].geometry;
                query.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
            }
            var queryUrl = $("#queryTaskDiv [node-type=findLayerSelect]").val();
            var queryTask = new QueryTask( queryUrl );
            this.app.Msg.showLoading();
            queryTask.execute( query ).then($.proxy(function(results) {
                var len = results.features.length;
                if (len > 0) {
                    for (var i = 0; i < len; i++) {
                        var feature = results.features[i];
                        var symbol;
                        switch (feature.geometry.type) {
                            case "point":
                            case "multipoint":
                                symbol = new SimpleMarkerSymbol();
                                break;
                            case "polyline":
                                symbol = new SimpleLineSymbol();
                                break;
                            default:
                                symbol = new SimpleFillSymbol();
                                break;
                        }
                        feature.symbol = symbol;
                        this.app.resultLayer.add(feature);
                    }
                   var _html = baidu.template(queryResulttmpl, results );
                    $("#queryTaskDiv [node-type=queryResult]").html( _html );
                    this.app.Msg.closeMsgBox();
                }else{
                    this.app.Msg.showTxt("没有符合条件的数据！");
                }
            }, this),$.proxy(function(error){
                //错误信息
                this.app.Msg.showTxt(error);
            },this));
        },

        getRules: function(){
            var union = $("#queryTaskDiv [node-type=findRulesUnion]").val();
            var whereStr = "";
            //遍历规则
            var $ruleDomArr = $("#queryTaskDiv [node-type=rulesBox] .well");
            $ruleDomArr.each(function(i, dom){
                var k = $(dom).find("[node-type=ruleItemField]").val();
                var judge = $(dom).find("[node-type=ruleItemJudge]").val();
                var v = $(dom).find("[node-type=ruleItemValue]").val();
                var ruleItem = k + "" + judge + "" + v;
                if(judge == "like"){
                    ruleItem = k + " like '%" + v +"%'";
                }
                whereStr += ruleItem;
                if(i < $ruleDomArr.length-1){
                    whereStr += " " + union + " ";
                }
            });
            return whereStr;
        }
    });

});
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
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "esri/tasks/FindParameters",
    "esri/tasks/FindTask",
    "dojo/text!findtask/tmpl/findtask.html",
    "dojo/text!findtask/tmpl/findItem.html",
    "dojo/text!findtask/tmpl/findResult.html",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol"
], function (
    declare,
    lang,
    FindParameters,
    FindTask,
    findTaskTmpl,
    findItemTmpl,
    findResultTmpl,
    SimpleFillSymbol,
    SimpleMarkerSymbol,
    SimpleLineSymbol
){
    return declare(null, {
        app: null,
        fieldsData:{},
        layerIds:[],

        constructor: function( app ){
            this.app = app;
            this.bindDomEvents();
        },

        startup: function () {
            var _html = baidu.template(findTaskTmpl, this.app.config);
            $("#findTaskDiv").html( _html );
            this.queryLayersFields();
            this.initSelectWidget();
        },

        bindDomEvents: function(){
            //根节点是#findTaskDiv
            $("#findTaskDiv").delegate("[node-type=layers]", "change", $.proxy(function(e){
                var layers = $("#findTaskDiv").find("input[node-type=layer][type='checkbox']:checked");
                this.addFields2AlLFields(layers);
            }, this) );

            //添加规则
            $("#findTaskDiv").delegate("[node-type=addRole]", "click", $.proxy(function(e){
                $("[node-type=rulesBox]").append( $("[node-type=ruleItemTmpl]").children().clone() );
            }, this) );

            //执行查询
            $("#findTaskDiv").delegate("[node-type=find]", "click", $.proxy(function(e){
                this.executeFind();
            }, this) );
        },

        //查询字段
        queryLayersFields:function(){
            var baseUrl = this.app.config.task_data.baseUrl ;
            $.each(this.app.config.task_data.itemData, $.proxy(function(i,item){
                $.ajax({
                    data:{
                        f:"json"
                    },
                    type: "GET",
                    url: baseUrl + item.index,
                    dataType: "jsonp"
                }).then($.proxy(function(res){
                    this.fieldsData[item.index] = res.fields ;
                },this));
            },this));

        },

        initSelectWidget:function(){
            $("#findTaskDiv").find("select[node-type=fieldSelect]").bootstrapDualListbox({
                nonSelectedListLabel: '未选字段',
                selectedListLabel: '已选字段',
                moveOnSelect: true,
                showFilterInputs:false
            });
        },

        addFields2AlLFields:function(layers){
            var fields = [] ;
            this.layerIds = [] ;
            $.each(layers, $.proxy(function(i,layer){
                var layerIndex = $(layer).attr("node-data");
                fields = fields.concat(this.fieldsData[layerIndex]);
                this.layerIds.push(Number(layerIndex));
            },this));
            var _html = baidu.template(findItemTmpl,this.fieldsFormat(fields));
            $("#findTaskDiv").find("div[node-type=fieldSelectDiv]").html(_html);//重新创建fieldSelect控件
            this.initSelectWidget();//重新初始化bootstrapDualListbox
        },

        fieldsFormat:function(felds){
            this.allFields = [] ;
            $.each(felds, $.proxy(function(i,field){
                this.allFields.push(field.alias) ;
            },this));
            $.unique(this.allFields);
            return {fields:this.allFields};
        },

        executeFind: function(){
            this.app.resultLayer.clear();

            var findTask = new FindTask(this.app.config.task_data.baseUrl);
            var params = new FindParameters();
            var searchFields = $('select[node-type="fieldSelect"]').val();
            var searchText = $('input[node-type="searchValue"]').val() ;
            params.layerIds = this.layerIds ;
            params.searchFields = searchFields ;
            params.searchText = searchText;
            params.returnGeometry = true ;
            this.app.Msg.showLoading();
            findTask.execute( params ).then($.proxy(function(results){
                var len = results.length;
                if (len > 0) {
                    for (var i = 0; i < len; i++) {
                        var feature = results[i].feature;
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
                    var _html = baidu.template(findResultTmpl, {features:results });
                    $("#findTaskDiv [node-type=findResult]").html( _html );
                    this.app.Msg.closeMsgBox();
                }else{
                    this.app.Msg.showTxt("没有符合条件的数据！");
                }
            }, this),$.proxy(function(error){
                this.app.Msg.showTxt(error);
            }, this));

        }
    });

});
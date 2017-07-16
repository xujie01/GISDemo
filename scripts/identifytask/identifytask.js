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
    "esri/tasks/IdentifyParameters",
    "esri/tasks/IdentifyTask",
    "dojo/text!identifytask/tmpl/identifytask.html",
    "dojo/text!identifytask/tmpl/identifyResult.html",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/graphic",
    "esri/toolbars/draw"
], function (
    declare,
    lang,
    IdentifyParameters,
    IdentifyTask,
    identifyTaskTmpl,
    identifyResultTmpl,
    SimpleFillSymbol,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    Graphic,
    Draw
){
    return declare(null, {
        app: null,
        layerIds:[],

        constructor: function( app ){
            this.app = app;
            this.bindDomEvents();
        },

        bindDomEvents: function(){
            //图层改变
            $("#identifyTaskDiv").delegate("[node-type=layers]", "change", $.proxy(function(e){
                var layers = $("#identifyTaskDiv").find("input[node-type=layer][type='checkbox']:checked");
                this.selectedLayerIds(layers);
            }, this) );

            //执行查询
            $("#identifyTaskDiv").delegate("[node-type=identify]", "click", $.proxy(function(e){
                this.executeFind();
            }, this) );

            //绘制查询的几何图形
            $("#identifyTaskDiv").delegate("[node-type=geomertyRule]", "click", $.proxy(function(e){
                $("#identifyTaskDiv [node-type=identifyResult]").html("");
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
            var _html = baidu.template(identifyTaskTmpl, this.app.config);
            $("#identifyTaskDiv").html( _html );
            this.initDrawTools();
        },

        initDrawTools:function(){
            this.toolbar = new Draw(this.app.map);
            this.toolbar.on("draw-end",  $.proxy(function(evt){
                this.toolbar.deactivate();
                var symbol ;
                switch (evt.geometry.type) {
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
                var graphic = new Graphic(evt.geometry, symbol);
                this.app.tempLayer.add(graphic);
            },this));
        },

        selectedLayerIds:function(layers){
            this.layerIds = [] ;
            $.each(layers, $.proxy(function(i,layer){
                var layerIndex = $(layer).attr("node-data");
                this.layerIds.push(Number(layerIndex));
            },this));
        },

        executeFind: function(){
            this.app.resultLayer.clear();

            var identifyTask = new IdentifyTask(this.app.config.task_data.baseUrl);
            var identifyParams = new IdentifyParameters();
            identifyParams.tolerance = 3;
            identifyParams.returnGeometry = true;
            identifyParams.layerIds = this.layerIds ;
            identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
            identifyParams.width = this.app.map.width;
            identifyParams.height = this.app.map.height;
            identifyParams.mapExtent = this.app.map.extent;
            var graphics = this.app.tempLayer.graphics ;
            if(graphics.length  >  0){
                identifyParams.geometry = graphics[0].geometry;
            }else{
                this.app.Msg.showTxt("请选择几何图形！");
                return ;
            }
            this.app.Msg.showLoading();
            identifyTask.execute( identifyParams ).then($.proxy(function(results){
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
                    var _html = baidu.template(identifyResultTmpl, {features:results });
                    $("#identifyTaskDiv [node-type=identifyResult]").html( _html );
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
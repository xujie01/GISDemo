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
    "dojo/on",
    "esri/units",
    "esri/dijit/BasemapGallery",
    "esri/dijit/Geocoder",
    "esri/dijit/Measurement",
    "esri/dijit/Bookmarks",
    "esri/SpatialReference",
    "esri/geometry/Point",
    "esri/symbols/PictureMarkerSymbol",
    "esri/graphic",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "esri/InfoTemplate",
    "esri/geometry/Extent",
    "esri/toolbars/navigation",
    "esri/dijit/Print",
    "esri/toolbars/draw",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/toolbars/edit",
    "dojo/_base/event",
], function (
    declare,
    lang,
    on,
    Units,
    BasemapGallery,
    Geocoder,
    Measurement,
    Bookmarks,
    SpatialReference,
    Point,
    PictureMarkerSymbol,
    Graphic,
    IdentifyTask, IdentifyParameters,
    InfoTemplate,
    Extent,
    Navigation,
    Print,
    Draw,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    SimpleFillSymbol,
    Edit,
    event

){
    return declare(null, {
        measurement: null,
        app: null,
        mapClickHandler: null,

        constructor: function( app ){
            this.app = app;
            this.bindDomEvents();
        },

        bindDomEvents: function(){
            //工具条关联的面板开关-toobar按钮点击
            $("#esricdBar").delegate("button[data-rel-panel]", "click", function(e){
                var $btn = $(e.currentTarget);
                var $panel = $("#" + $(e.currentTarget).attr("data-rel-panel") );
                if( $btn.hasClass("active") ){
                    //当前是被按下状态，需要弹起，且关闭panel
                    $btn.removeClass("active");
                    $panel.hide(100);
                }else{
                    //先弹起所有的按钮
                    $(".navbar button[data-rel-panel]").removeClass("active");
                    $(".navbar div[data-rel-btn]").hide();
                    //当前是弹起状态，需要按下，且打开panel
                    $btn.addClass("active");
                    $panel.show(100);
                }

            });
            //工具条关联的面板关闭, 1关闭按钮点击 2BasemapGallery上的地图点击
            $("#esricdBar").delegate("[node-type=hideBarPanel],.esriBasemapGalleryThumbnail", "click", function(e){
                var $panel = $(e.currentTarget).parents(".esricd-bar-panel");
                var $btn = $("#" + $panel.attr("data-rel-btn") );
                $panel.hide(100);
                $btn.removeClass("active");
            });
            //测量工具关闭时，清空结果
            //toolbar按钮点击都需要执行
            $("#esricdBar").delegate("button[data-rel-panel], button[node-type=hideBarPanel]", "click",
                $.proxy(function(e){
                    this.clearPrinterResult();
                    this.app.map && this.app.map.graphics && this.app.map.graphics.clear();
                }, this) );


            //定位按钮点击
            $("#esricdBar").delegate("[node-type=toXyBtn]", "click", $.proxy(function(e){
                this.app.map.graphics.clear();

                var val = $("[node-type=toXyInput]").val();
                val = val.replace("，",",");
                var x = val.split(",")[0];
                var y = val.split(",")[1];
                if( !(x&&y) ){
                    alert("输入经纬度格式错误！");
                    return;
                }
                var pt = new Point(x, y, new SpatialReference({ wkid: 4326 }));

                var pictureMarkerSymbol = new PictureMarkerSymbol('theme/base/images/position.png', 25, 25);
                var graphic = new Graphic(pt, pictureMarkerSymbol );
                this.app.map.centerAt( pt );
                this.app.map.graphics.add( graphic );

            },this) );

            //点查询按钮点击
            $("#esricdBar").delegate("#toolbarIdentifyBtn", "click", $.proxy(function(e){
                //var data_enable = $(e.currentTarget).attr("data-enable");
                //var enable = (data_enable=="1");
                var enable = $(e.currentTarget).hasClass("active");
                if( enable ){
                    this.disableIdentify();
                }else{
                    this.enableIdentify();
                }
            }, this) );

            //放大缩小

            var navToolbar

            $("#esricdBar").delegate("[node-type=zoomInBtn]","click",$.proxy(function(e){
                if(navToolbar==undefined){
                    navToolbar = new Navigation(this.app.map);
                }
                navToolbar.activate(Navigation.ZOOM_IN);
            },this));
            $("#esricdBar").delegate("[node-type=zoomOutBtn]","click",$.proxy(function(e){

                if(navToolbar==undefined){
                    navToolbar=new Navigation(this.app.map);
                }
                navToolbar.activate(Navigation.ZOOM_OUT);

            },this));

            $("#esricdBar").delegate("[node-type=panBtn]","click",$.proxy(function(e){
                if(navToolbar==undefined){
                    navToolbar=new Navigation(this.app.map);
                }
                navToolbar.activate(Navigation.PAN);
            },this));

            $("#esricdBar").delegate("[node-type=drawBtn]","click",$.proxy(function(e){
                var tool = $(e.currentTarget).text().toUpperCase().replace(/ /g, "_");
                if(tool != "清空"){
                    this.toolbar.activate(Draw[tool]);
                }else{
                    this.app.editLayer.clear();
                    if(this.editToolbar){
                        this.editToolbar.deactivate();
                    }
                }
            },this));
        },

        clearPrinterResult: function(){
            if( this.measurement ){
                this.measurement.clearResult();
                var curTool = this.measurement.getTool();
                if( curTool && curTool.toolName ){
                    this.measurement.setTool(curTool.toolName, false);
                }
            }
        },

        startup: function () {
            this.initGeocoder();
            this.initMeasurement();
            this.initBookmark();
            this.initIdentify();
            this.initPrinter();
            this.initDrawTools();
            this.initEditTools();
        },

        initGeocoder: function(){
            var geocoder = new Geocoder({
                map: this.app.map,
                highlightLocation: true,
                theme: "arcgisGeocoder"
            }, "GeocoderDiv");
            geocoder.startup();
        },

        initMeasurement: function(){
            // console.log("Units:", Units)
            this.measurement = new Measurement({
                map: this.app.map,
                defaultAreaUnit: Units.SQUARE_KILOMETERS,
                defaultLengthUnit: Units.KILOMETERS
            }, "measurementDiv");
            this.measurement.startup();
        },

        initBookmark: function(){
            var bookmark = new Bookmarks({
                map: this.app.map,
                bookmarks: [],
                editable: true
            }, "bookmarkDiv");

        },

        //点击查询弹窗-初始化
        initIdentify: function(){

        },

        initPrinter:function(){
            var printer = new Print({
                map: this.app.map,
                url:this.app.config.print_url
            }, "print");
            printer.startup();

        },

        initDrawTools:function(){
            this.toolbar = new Draw(this.app.map);
            var symbol;
            this.toolbar.on("draw-end",  $.proxy(function(evt){
                this.toolbar.deactivate();
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
                this.app.editLayer.add(graphic);
            },this));
        },

        //编辑绘制的图层
        initEditTools:function(){
            this.editToolbar = new Edit(this.app.map);
            this.app.editLayer.on("click", $.proxy(function(evt) {
                event.stop(evt);
                var graphic = evt.graphic ;
                var tool = Edit.MOVE | Edit.EDIT_VERTICES |  Edit.SCALE | Edit.ROTATE | Edit.EDIT_TEXT;

                var options = {
                    allowAddVertices: true,
                    allowDeleteVertices: true,
                    uniformScaling: true
                };
                this.editToolbar.activate(tool, graphic, options);
            },this));

            //deactivate the toolbar when you click outside a graphic
            this.app. map.on("click",  $.proxy(function(evt){
                this.editToolbar.deactivate();
            },this));
        },

        //禁用
        disableIdentify: function(){
            //  console.log( "disableIdentify", this.mapClickHandler );
            if( this.mapClickHandler ){
                this.mapClickHandler.remove();
            }
        },
        //启用
        enableIdentify: function(){
            //console.log( "enableIdentify", this.mapClickHandler );

            this.mapClickHandler = on(this.app.map, "click",
                $.proxy(this.executeIdentifyTask, this) );
        },

        //执行点查询
        executeIdentifyTask: function(evt){

            var urlArr = this.app.getMapserverUrls();
            var deferredArr =[];
            $.each(urlArr, $.proxy(function(i,_url){
                //  console.log("_url",_url, urlArr);
                deferredArr.push( this.identifyMapserverItem(_url, evt) );
            },this) );
            this.app.map.infoWindow.setFeatures( deferredArr );
            this.app.map.infoWindow.show( evt.mapPoint );

        },

        //对一个mapserver url进行查询，返回deferred
        identifyMapserverItem: function( mapserverUrl, mapClickEvent ){

            var identifyParams = new IdentifyParameters();
            identifyParams.tolerance = 3;
            //identifyParams.returnGeometry = true; //返回geometry的话，会网络下载慢，但会显示出graphic
            //identifyParams.layerIds = [0];
            identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
            identifyParams.width = this.app.map.width;
            identifyParams.height = this.app.map.height;
            identifyParams.geometry = mapClickEvent.mapPoint;
            identifyParams.mapExtent = this.app.map.extent;

            //var mapserverUrl = this.app.config.itemInfo.itemData.operationalLayers[0].url;
            var identifyTask = new IdentifyTask( mapserverUrl );

            var deferred = identifyTask.execute(identifyParams).addCallback($.proxy(function(res){
                //  console.log("identifyTask res:", res);
                var featureArr = [];
                $.each(res, function(i, obj){
                    var tit = obj.layerName;
                    var infoTmpl = new InfoTemplate(tit, "${"+ obj.displayFieldName +"} <br/>ID: ${OBJECTID}");
                    var f = obj.feature;
                    f.setInfoTemplate(infoTmpl);

                    featureArr.push( f );
                });
                return featureArr;
            },this));

            return deferred;

        }
    });

});
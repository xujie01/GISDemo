define(["dojo/_base/declare",
    "esri/map",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "config/defaults",
    "esri/dijit/HomeButton",
    "esri/dijit/LocateButton",
    "esri/dijit/OverviewMap",
    "esri/dijit/Scalebar",
    "bar/bar",
    "querytask/querytask",
    "findtask/findtask",
    "identifytask/identifytask",
    "msgmanager/msgmanager"
], function (declare,
              Map,
              ArcGISTiledMapServiceLayer,
              ArcGISDynamicMapServiceLayer,
              GraphicsLayer,
              FeatureLayer,
              defaults,
              HomeButton,
              LocateButton,
              OverviewMap,
              Scalebar,
              Bar,
              QueryTask,
              FindTask,
              identifyTask,
              MsgManager) {
    return declare(null, {
        map: null,
        config: {},
        constructor: function () {
            this.resizeUi();
            this.bindDomEvents();
            this.bar = new Bar(this);
            this.queryTask = new QueryTask(this) ;
            this.findTask = new FindTask(this);
            this.identifyTask = new identifyTask(this);
            this.Msg = new MsgManager();
        },

        //调整ui尺寸
        resizeUi: function () {
            var mapH = $("body").height() - $("#mapDiv").position().top;
            $("#mapDiv, .esricd-panel").height(mapH);
        },

        //绑定dom事件
        bindDomEvents: function () {
            //左右面板关闭
            $("body").delegate("[node-type=hidePanel]", "click", function (e) {
                var $panelDom = $(e.currentTarget).parents(".esricd-panel");
                if ($panelDom.hasClass("esricd-panel-right")) {
                    $panelDom.css("right", "-330px");
                } else {
                    $panelDom.css("left", "-300px");
                }
            });

            //左右面板打开
            $("body").delegate("[node-type=showPanel]", "click", function (e) {
                var panelDomId = $(e.currentTarget).attr("data-for");
                var $panelDom = $("#" + panelDomId);
                //console.log("$panelDom", $panelDom);
                if ($panelDom.hasClass("esricd-panel-right")) {
                    $panelDom.css("right", "-2px");
                } else {
                    $panelDom.css("left", "-2px");
                }
            });
            //底部数据表关闭
            $("body").delegate("[node-type=hideBotPanel]", "click", function (e) {
                var $panelDom = $(e.currentTarget).parents(".esricd-bot-box");
                $panelDom.css("bottom", "-200px");
            });
        },

        startup: function () {
            this.config = defaults;
            this._createWebMap();
        },

        _createWebMap: function () {
            this.map = new Map("mapDiv",{
                center: [104.06,30.67],
                    zoom: 3
            });
            var titlelayer =  new ArcGISTiledMapServiceLayer(this.config.titlelayer);
            this.editLayer = new GraphicsLayer({id:"editFeatureLayer"});
            this.tempLayer = new GraphicsLayer({id:"tempLayer"});
            this.resultLayer = new GraphicsLayer({id:"resultLayer"});

            this.map.addLayers([titlelayer,this.editLayer, this.tempLayer,this.resultLayer]);


            this.addMapControls();
            this.initComponents();

        },

        //地图创建后，添加相关控件
        addMapControls: function () {
            //home按钮
            var homeButton = new HomeButton({
                map: this.map
            }, "HomeButton");
            homeButton.startup();
            //鹰眼控件
            var overviewMapDijit = new OverviewMap({
                map: this.map,
                attachTo: "bottom-right",
                opacity: 0.40,
                visible: false
            });
            overviewMapDijit.startup();
            //比例尺控件
            var scalebar = new Scalebar({
                map: this.map,
                scalebarUnit: "metric"
            });
        },

        //初始化其他一些控件, map创建之后才会执行
        initComponents: function () {
            this.bar.startup();
            this.queryTask.startup();
            this.findTask.startup() ;
            this.identifyTask.startup();
            this.Msg.startup();
        },

        //获取app中所有的mapserver类型图层url
        getMapserverUrls: function(){
            var _isMapserver = function(layerItem){
                var isMapserver = false;
                if(layerItem.resourceInfo.type != "Feature Layer"){
                    isMapserver = true;
                }
                return isMapserver;
            };

            var opLayers = this.config.itemInfo.itemData.operationalLayers;
            var mapserverUrls = [];
            $.each( opLayers, function(i, layerItem){
                //判断是否是mapserver图层
                var isMapserver = false;
                if( _isMapserver(layerItem) ){
                    mapserverUrls.push(layerItem.url);
                }
            });

            return mapserverUrls;
        }
    });
});

//低版本浏览器提示
(function () {
    var ie678 = '\v' == 'v';
    if (ie678) {
        alert("系统不支持ie8及以下版本浏览器访问！\n 请使用ie9+或chrome、safari等浏览器。");
    }
})();
define({
    titlelayer:"http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer",
    print_url:"https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
    geoserver_url:"https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",
    task_data: {
        baseUrl: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/",
        itemData: [
            {title: "世界主要城市", index: "0"},
            {title: "世界主要大洲", index: "1"},
            {title: "世界地图", index: "2"}
        ]
    }
});
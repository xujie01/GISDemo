var pathRegex = new RegExp(/\/[^\/]+$/);/*匹配最后一个/到最后*/
var locationPath = location.pathname.replace(pathRegex, '');
var dojoConfig = {
    async:true,
    paths:{
        app:locationPath+"/scripts" ,
        config:locationPath + "/config",
        bar:locationPath + "/scripts/bar",
        querytask:locationPath + "/scripts/querytask",
        findtask:locationPath + "/scripts/findtask",
        identifytask:locationPath + "/scripts/identifytask",
        msgmanager:locationPath + "/scripts/msgmanager",
        geoprocessor:locationPath + "/scripts/geoprocessor"
    }
};
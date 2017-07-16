define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/text!msgmanager/tmpl/errortmpl.html",
    "dojo/text!msgmanager/tmpl/loadingtmpl.html",
    "dojo/text!msgmanager/tmpl/texttmpl.html",
], function (
    declare,
    lang,
    errortmpl,
    loadingtmpl,
    texttmpl
){
    return declare(null, {
        title:'<img id="msgClose" class="esricd-msg-box-content-close" src="theme/base/images/waiting.gif"/>' ,
        constructor: function( app ){
            this.app = app;
            this.bindDomEvents();
        },

        startup: function () {

        },

        bindDomEvents: function(){
            $("#msgbox").delegate("img[node-type=msgClose]", "click", $.proxy(function(e) {
               this.closeMsgBox();
            },this));
        },

        closeMsgBox:function(){
            $("#msgbox").hide();
        },

        showLoading: function(){
            $("#msgbox").show().html(loadingtmpl);
        },

        showTxt: function(txt){
            var _html = baidu.template(texttmpl, {txt:txt});
            $("#msgbox").show().html(_html);
        },

        showError: function( error ){
            $("#msgbox").show().html(errortmpl);
        }
    });

});
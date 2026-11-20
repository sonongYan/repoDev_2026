/*
 * @Author: MrAlenZhong
 * @Date: 2021-10-25 11:16:02
 * @LastEditors: MrAlenZhong
 * @LastEditTime: 2022-02-24 09:09:18
 * @Description: 
 */

(function (window, document) {
    var wordMap = {
        checkTitle: ["请完成安全验证", "Please complete security verification"],
        refreshImg: ["刷新图片", "Refresh picture"],
        dragSlide: [
            "按住滑块，拖动完成上面拼图",
            "use slider to complete jigsaw puzzle",
        ],
        secondsUnit: ["秒", "second"],
        failInfo_0: ["验证成功:用时", "Verification success:"],
        failInfo_1: [
            "验证失败:拖动滑块将悬浮图像正确拼合",
            "Verification failed: drag the slider to complete jigsaw puzzle",
        ],
        failInfo_2: [
            "验证码超时，刷新后重试",
            "Verification code timeout, refresh and try again",
        ],
        failInfo_3: [
            "重试过多，刷新后重试",
            "Too many retries. Refresh and try again",
        ]
    };
    var Verify = function (targetDom, options) {
        // 判断是用函数创建的还是用new创建的。这样我们就可以通过Verify("dom") 或 new Verify("dom")来使用这个插件了
        // 获取dom
        this.targetDom = document.getElementById(targetDom);
        if (!(this instanceof Verify)) return new Verify(targetDom, options);
        if (!options.imgUrl) {
            console.error("imgUrl属性必填");
            return;
        }
        // （0.2后废弃）
        // if(!options.validateUrl){
        // console.error("validateUrl属性必填")
        //     return
        // }
        if (!targetDom) {
            console.error("targetDom属性必填");
            return;
        } else if (!this.targetDom) {
            console.error("targetDom不存在");
            return;
        }
        var defaultOption = {
            mode: "slide", //模式的选择
            // bgImgUrl: "",   //获取背景图片的接口
            imgUrl: "", //获取抠图图片的接口
            // "validateUrl":"",   //校验的拖动的接口（0.2后废弃）
            width: "260", //底图的宽度
            height: "120", //底图的高度
            ajaxHeader: {},  //ajax header
            retryCount: 5, //重试的次数
            timeout: 5, //超时时间
            errorRange: 5, //拖动的误差像素
            smallImgWidth: 45, //小图的宽度
            lang: "zh" //国际化
        };
        // 参数
        if (!options.mode || options.mode === "slide") {
            this.options = $.extend(defaultOption, options);
        } else {
            this.options = $.extend(
                defaultOption,
                {
                    width: "128", //底图的宽度
                    height: "48" //底图的高度
                },
                options
            );
        }
        var html = "";
        if (this.options.mode === "slide") {
            html =

                "<div class='slide-box'>" +
                "<div class='slide-header'>"
                +
                "<div class='slide-box-title'>" + this._localI18n("checkTitle") + "</div>" +
                " <div class='slide-img-btn-ctl'>" +
                "<div id='slide-refresh-btn' class='slide-img-reflash' title='" +
                this._localI18n("refreshImg") +
                "'></div>" +
                "</div>" +
                "</div>" +
                "<div class='slide-img-block'>" +
                "<div class='slide-loading'></div>" +
                "<div class='slide-img-box'>" +
                "<div id='slide-img-box-wrap'>" +
                "<img id='slide-bigImg' src='/style/jquery-verify/img/loading.gif' />" +
                "<img width='66' height='66' id='slide-smallImg' />" +
                "</div>" +
                "</div>" +
                "<div id='slide-validate-info'>" +
                "<div id='slide-validate-fail' class='validate-fail-info slide-img-info-text' style='display:none'>" +
                "<div id='fail-reason' class='fail-info-text'>" +
                this._localI18n("failInfo_1") +
                "</div>" +
                "</div>" +
                "<div id='slide-validate-success' class='validate-success-info slide-img-info-text' style='display:none'>" +
                "<div class='success-info-text'>" +
                this._localI18n("failInfo_0") +
                "<span id='valiTime'></span>" +
                this._localI18n("secondsUnit") +
                "</div>" +
                "</div>" +

                "</div>" +
                "</div>" +
                "<div class='slide-img-scroll-bar'>" +
                "<div id='slide-img-btn' class='slide-img-btn'></div>" +
                "<div id='slide-img-hint' class='slide-img-text'>" +
                this._localI18n("dragSlide") +
                "</div>" +
                "</div>" +
                "</div>";
        } else {
            html =
                "<div class='code-box'>" +
                "<img class='code-img' id='code-img' />" +
                "</div>";
        }
        this.targetDom.innerHTML = html;
        /**********************    slide variable start      **********************/
        this.slideBtn = $("#slide-img-btn"); // 拖拽按钮
        this.refreshBtn = $("#slide-refresh-btn"); // 换图按钮
        this.slideHint = $("#slide-img-hint"); // 提示名称
        this.bigImg = $("#slide-bigImg"); //大图
        this.smallImg = $("#slide-smallImg"); //小图
        this.successReasonWrap = $("#slide-validate-success"); //验证成功的文本框
        this.failReasonWrap = $("#slide-validate-fail"); //验证失败的文本框
        this.slideContent = $("#slideContent"); // 正确、失败的正文
        this.slideHintInfo = $("#slide-validate-info"); // 弹出
        this.startX = 0; //开始拖动的鼠标x轴坐标
        this.timer = 0; //校验成功的费时时间
        this.startTamp = 0; //开始拖动的时间
        this.endTamp = 0; //结束拖动的时间
        this.x = 0; //拖动的距离
        this.isSuccess = true; //校验拖动是否正确
        this.code = ""; //判断图片的code唯一标识码
        /**********************    slide variable end      **********************/

        /**********************    code variable start      **********************/
        this.codeImg = $("#code-img"); //验证码图片

        /**********************    code variable end      **********************/
        this._init();
    }
    Verify.prototype = {
        _init: function () {
            // jQuery.support.cors =  true;
            if (this.options.mode === "slide") {
                this._slideBindEvent();
            } else {
                this._codeBindEvent();
            }
        },
        //国际化
        _localI18n: function (keyword) {
            if (this.options.lang === "zh") {
                return wordMap[keyword][0];
            } else {
                return wordMap[keyword][1];
            }
        },
        /**********************    slide  start      **********************/
        //【slide】绑定事件
        _slideBindEvent: function () {
            var _this = this;
            _this._refreshSlideImg();
            console.log("_isMobile", _this._isMobile());
            if (_this._isMobile()) {
                _this.slideBtn.on("touchstart", function (event) {
                    console.log("touchstart", event.originalEvent.changedTouches[0].clientX);
                    _this._mousedownDrag(_this, event);
                });
            } else {
                _this.slideBtn.on("mousedown", function (event) {
                    console.log("mousedown");
                    _this._mousedownDrag(_this, event);
                });

            }
            _this.refreshBtn.on("click", function () {
                _this._refreshSlideImg(_this);
            });
        },

        //【slide】异步获取图片并重新渲染
        _refreshSlideImg: function () {
            var _this = this;
            this.bigImg = $("#slide-bigImg")
            $.ajax({
                type: "get",
                url: _this.options.imgUrl,
                //   jsonpCallback: "test",
                dataType: "jsonp",
                jsonp: "callback",
                data: {
                    Authorization: _this.options.ajaxHeader.Authorization,
                    width: _this.options.width,
                    height: _this.options.height,
                    timeout: _this.options.timeout,
                    length: _this.options["length"],
                    errorRange: _this.options.errorRange,
                    retryCount: _this.options.retryCount,
                    r: Math.ceil(Math.random() * 100000000).toString(),
                },

                success: function (data) {
                    _this.code = data.id;
                    _this.slideBtn.css({ left: "0" });
                    var origin = _this.getUrlHost();
                    $("#slide-bigImg").attr({
                        src: origin + "/verifyImage/bigImage/" + data.id,
                    });
                    _this.smallImg.attr({
                        src: origin + "/verifyImage/smallImage/" + data.id,
                        height: _this.options.height,
                        width: _this.options.smallImgWidth,
                    });
                    _this.smallImg.css({ left: "0px" });
                    _this.slideHintInfo.css({ display: "none" });
                    _this.slideHint.css({ display: "block" });
                },
                error: function (err) {
                    console.log(err);
                },
            });
        },
        _isMobile: function () {
            var userAgentInfo = navigator.userAgent;

            var mobileAgents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];

            var mobile_flag = false;

            //根据userAgent判断是否是手机
            for (var v = 0; v < mobileAgents.length; v++) {
                if (userAgentInfo.indexOf(mobileAgents[v]) > 0) {
                    mobile_flag = true;
                    break;
                }
            }

            var screen_width = window.screen.width;
            var screen_height = window.screen.height;

            //根据屏幕分辨率判断是否是手机
            if (screen_width < 500 && screen_height < 800) {
                mobile_flag = true;
            }

            return mobile_flag;
        },

        //【slide】拖动事件
        _mousedownDrag: function (_this, e) {
            console.log("_mousedownDrag", this._isMobile());
            e.preventDefault();
            _this.startX = this._isMobile() ? e.originalEvent.changedTouches[0].clientX : e.clientX;
            _this.startTamp = new Date().valueOf();
            var target = e.target;
            target.style.backgroundPosition = "0 -216px";
            _this.slideHint.css({ display: "none" });
            if (this._isMobile()) {
                $(document).on("touchmove", mousemove);
                $(document).on("touchend", mouseup);
            } else {
                $(document).on("mousemove", mousemove);
                $(document).on("mouseup", mouseup);
            }
            // 拖拽
            function mousemove(event) {
                console.log("mousemove");
                let clientX = _this._isMobile() ? event.originalEvent.changedTouches[0].clientX : event.clientX;
                _this.x = clientX - _this.startX;
                var max_width =
                    parseInt(_this.bigImg.css("width")) - _this.options.smallImgWidth;
                if (_this.x < 0) {
                    _this.slideBtn.css({ left: "0px" });
                    _this.smallImg.css({ left: "0px" });
                } else if (_this.x >= 0 && _this.x <= max_width) {
                    _this.slideBtn.css({ left: _this.x + "px" });
                    _this.smallImg.css({ left: _this.x + "px" });
                } else {
                    _this.slideBtn.css({ left: max_width + "px" });
                    _this.smallImg.css({ left: max_width + "px" });
                }
                _this.slideBtn.css({ transition: "none" });
                _this.smallImg.css({ transition: "none" });
            }
            // 鼠标放开
            function mouseup() {
                console.log("mouseup");
                $(document).unbind("mousemove", mousemove);
                $(document).unbind("mouseup", mouseup);
                $(document).unbind("touchmove", mousemove);
                $(document).unbind("touchend", mouseup);
                var left = _this.smallImg.css("left");
                left = parseInt(left.substring(0, left.length - 2));
                _this.options.slideEvent &&
                    _this.options.slideEvent(_this.x, _this.code, _this);
            }
        },
        //【slide】滚动条和拼图初始化位置
        reSlide: function () {
            this.slideBtn.css({ left: "0px" });
            this.smallImg.css({ left: "0px" });
            this.slideHintInfo.css({ display: "none" });
            this.slideHint.css({ display: "block" });
        },

        //【slide】校验拖拽的位置是否合理
        validateSlide: function (statusCode) {
            var _this = this;
            //校验成功
            if (statusCode === 0) {
                //验证成功
                _this.isSuccess = true;
                _this.failReasonWrap.css({ display: "none" });
                _this.successReasonWrap.css({ display: "block" });
                _this.slideHintInfo.css({ display: "block" });
                _this.endTamp = new Date().valueOf();
                _this.timer = ((_this.endTamp - _this.startTamp) / 1000).toFixed(1);
                $("#valiTime").text(_this.timer);
            } else if (statusCode === 1) {
                //验证失败
                _this.isSuccess = false;
                _this.failReasonWrap.css({ display: "block" });
                _this.successReasonWrap.css({ display: "none" });
                _this.slideHintInfo.css({ display: "block" });
                $("#fail-reason").text(_this._localI18n("failInfo_1"));
                setTimeout(function () {
                    _this.smallImg.css({
                        transition: "left 0.6s",
                        left: "0px"
                    });
                    _this.slideHintInfo.css({ 'display': 'none' });
                    _this.slideBtn.css({ left: "0" });
                    _this.slideHint.css({
                        display: "block",
                        // transition: "all 0.6s"
                    });
                }, 1000);
            } else {
                //验证码超时 和 验证码重试过多
                _this.isSuccess = false;
                _this.failReasonWrap.css({ display: "block" });
                _this.successReasonWrap.css({ display: "none" });
                _this.slideHintInfo.css({ display: "block" });
                var failInfoStr =
                    statusCode === "2"
                        ? _this._localI18n("failInfo_2")
                        : _this._localI18n("failInfo_3");
                $("#fail-reason").text(failInfoStr);
                //验证码重试过多后，自动刷新
                if (statusCode == "2") {
                    setTimeout(
                        function () {
                            _this._refreshSlideImg();
                        }, 500);
                }
            }
        },
        /**********************    slide  end      **********************/

        /**********************    code  start      **********************/
        //【code】绑定事件
        _codeBindEvent: function () {
            var _this = this;
            _this._refreshCodeImg();
            this.codeImg.on("click", function () {
                _this._refreshCodeImg();
            });
        },
        //【code】异步获取图片并重新渲染
        _refreshCodeImg: function (callback) {
            var _this = this;
            var _callback = callback ? callback : new Function();
            $.ajax({
                type: "get",
                url: _this.options.imgUrl,
                //   jsonpCallback: "test",
                dataType: "jsonp",
                jsonp: "callback",
                data: {
                    Authorization: _this.options.ajaxHeader.Authorization,
                    width: _this.options.width,
                    height: _this.options.height,
                    timeout: _this.options.timeout,
                    length: _this.options["length"],
                    errorRange: _this.options.errorRange,
                    retryCount: _this.options.retryCount,
                    r: Math.ceil(Math.random() * 100000000).toString(),
                },
                success: function (data) {
                    console.log("data.id", data.id);
                    _this.code = data.id;
                    var origin = _this.getUrlHost();
                    _this.codeImg.attr({
                        src: origin + "/verifyCode/image/" + data.id,
                    });
                    _callback(data.id);
                },
            });
        },
        //【code】对外刷新验证码
        refreshCode: function (callback) {
            if (typeof callback === "function") {
                this._refreshCodeImg(callback);
            }
        },
        /**********************    code  end      **********************/
        getUrlHost: function () {
            var address = this.options.imgUrl;
            if (address.indexOf("verifyImage") > -1) {
                address = address.split("/verifyImage/getId")[0];
            } else {
                address = address.split("/verifyCode/getId")[0];
            }
            return address;
        }
    };

    window.Verify = Verify;
}(window, document));
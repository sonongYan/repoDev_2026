(function($){
    $.fn.drag = function(options, sucfun, errfun, callback){
        var isvalid = false;

        var x, drag = this, isMove = false, defaults = {
        };
        var options = $.extend(defaults, options);
        //添加背景，文字，滑块
        var barTpl = '<div class="drag_bg" style="background-color: rgb(122, 194, 60);"></div>'+
                    '<div class="drag_text" onselectstart="return false;" unselectable="on">拖动图片到正确位置</div>'+
                    '<div class="handler handler_bg"></div>';
        var modalTpl = '<div class="modal fade" id="mod-imageVerify">' +
			            '<div class="modal-backdrop fade"></div>' + 
			            '<div class="modal-dialog" style="width:320px;">' +
					    '<div class="modal-content">'+
							'<div class="modal-header">'+
								'<h2 class="text-center">图形验证码</h2>' +
								'<a class="icon close" role="button" data-dismiss="modal">关闭</a>' +
							'</div>'+
							'<div class="modal-body" style="height: 166px;">'+ '{{$content}}' +'</div>'+
                            '</div></div></div>';
        console.log(this)
        // this.empty();
        // this.append(html);
        
        var handler = drag.find('.handler');
        var drag_bg = drag.find('.drag_bg');
        var text = drag.find('.drag_text');
        //var maxWidth = drag.width() - handler.width();  //能滑动的最大间距
        //console.log(maxWidth);
        var maxWidth = 230;  //能滑动的最大间距
        var $xy_img = $("#xy_img");
        var $gt_cut_hidden = $("#yzm_image_cut_big");

        // 验证码移动方法
        function mouseUp(e) {
            $("#drag").unbind("mousemove")
            $("#drag").unbind("mouseleave")
            if(isvalid || !(e.pageX - x)) {  //_x有值才发请求，要不然会发2次请求
                return false;
            }
            isMove = false;
            var _x = e.pageX - x;
            //去到后台验证
            $.ajax({
                type:"POST",
                url: "../cargotracking/checkCapcha.do",
                data: {point: _x},
                dataType:"JSON",
                async: false,
                success:function(result){
                    if(result.returnObject) {
                        dragOk(_x);
                        callback(_x);
                    }else{
                        dragErr();
                    }
                    
                },
                error: function(err) {
                    $.ligerDialog.error('服务异常！');
                }
            });
        }

        //鼠标按下时候的x轴的位置
        handler.mousedown(function(e){
            e.preventDefault ? e.preventDefault() : (e.returnValue = false)
            if(isvalid) {
                return false;
            }
            $xy_img.show();
            isMove = true;
            x = e.pageX - parseInt(handler.css('left'), 10);
            $("#drag").on("mousemove",function(e){
                if(isvalid) {
                    return false;
                }
                var _x = e.pageX - x;
                if(isMove){
                    if(_x > 0 && _x <= maxWidth){
                        $xy_img.css({'left': _x});
                        handler.css({'left': _x});
                        drag_bg.css({'width': _x});
                    }else if(_x > maxWidth){  //鼠标指针移动距离达到最大时清空事件
                      //  dragOk();
                    }
                }
            });
            $("#drag").on("mouseleave",function(e){
                mouseUp(e)
            });
        });

        //鼠标指针在上下文移动时，移动距离大于0小于最大间距，滑块x轴位置等于鼠标移动距离
        $("#drag").mouseup(function(e){
            mouseUp(e)
        });

        var errcount = 0;
        function dragErr() {
            errcount = errcount + 1;
            isvalid = false;
            $(".drag_bg").css("background-color", "#C22A0E");
            text.text("验证失败");
            handler.removeClass('handler_bg').addClass('handler_err_bg');
            setTimeout(function(){
                //还原
                text.text("拖动图片到正确位置");
                $(".drag_bg").css("background-color", "#7ac23c");
                handler.removeClass("handler_err_bg").addClass("handler_bg");
                $xy_img.css({'left': 0});
                handler.css({'left': 0});
                drag_bg.css({'width': 0});
                //验证失败, 拖动错误数大于1次，那么就重置
                if(errcount >= 1) {
                    errfun();
                    errcount = 0;
                    $xy_img.show()
                    $gt_cut_hidden.show()
                }
            }, 1000);
        }
        //清空事件
        function dragOk(_x){
            isvalid = true;
            handler.removeClass('handler_bg').addClass('handler_ok_bg');
            text.text('验证通过');
            drag.css({'color': '#fff'});
            handler.unbind('mousedown');
            $(document).unbind('mousemove');
            $(document).unbind('mouseup');
            //验证通过，隐藏刷新
            $("#refreshyzm").css("display", "none");
            $("#passcheck").val("1");
            $("#yzm").val(_x);

            //显示原始图片,并做光线闪过
            $xy_img.show()
            $gt_cut_hidden.show()
            $gt_cut_hidden.addClass("run");  
          
        }

        function getBodyHtml(path){
            var html = '<div class="form-item" style="position:relative;">';
            html += '<div class="yzm">';
            html += '<div id="yzm_image_cut_big" class="yzm_image_cut_big"></div>';
            html += '<div id="yzm_image_cut_loading" class="yzm_image_cut_loading"></div>';
            html += '<div id="yzm_image_cut_small" class="yzm_image_cut_small"></div>';
            html += '<div style="top: 37px; left: 0px;display: none;" id="xy_img"></div>';
            html += '</div>';
            html += '<div id="drag" style="width: 260px;">'+barTpl+'</div>';
            html += '<img id="refreshyzm" src="'+path;
            html += 'images/imageCheck/refresh.png" style="position: absolute;top:5px;right: 5px;width: 20px;height: 20px;cursor: pointer;">';
            html += '<div class="errorMsg" style="font-size:14px; color:#de5d5d; display:none;">获取图形验证码失败！</div>'
            html += '</div>';
            html += '<div id="fieldMsg" style="font-size:15px;color:#de5d5d;display:none;margin-top:30px;">获取图形验证码失败！</div>'
            return html
        }

        drag.bodyHtml = function (path) {

            var tpl = getBodyHtml(path)
            return tpl;
        }
        drag.modalHtml = function (path) {

            var html = getBodyHtml(path)
            var tpl = modalTpl.replace( "{{$content}}", html );

            return tpl;
        }

       return drag;
        

    };
    
})(jQuery);



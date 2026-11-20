require(['base','city','laypage','store','session','template','text!../templates/cargoTracking.tpl','drag']
,function(base,CityList,laypage,Store,Session,template,cargoTrackingTpl,drag){
	$("body").append(cargoTrackingTpl); 
	
	//Session.saveObject("numbersQueried",[{'type':'A','value':'784-12312311'},{'type':"O",'value':"C2017032000064"},{'type':"A","value":'784-11111111'},{'type':"A","value":"182-00000000"}]);
	var pattern = {A:'^([0-9]{3}-?)?[0-9]{8}$',O:'^C[0-9]{14}$'};
	//首页查询跳转
	
	var numbers = Session.loadObject("numbersQueried");
	var doQueryCache = Session.loadObject("doQuery");
	var getPostfixCache = Session.loadObject("getPostfix");
  var getOrderManageOperation = Session.loadObject("orderManageOperation");
	var getHomeOperation = Session.loadObject("getHomeOperation");

	// 查询请求接口地址
	var DO_QUERY_URL = ''
	var VERIFY_IMAGE_POINT_X = null;  //图片验证 X位置

	//初始化日期，默认为相对于当前日期
	function initDate(num) {
		var dateParam = Date.parse(new Date());
		var sDate = dateParam + num * 24 * 60 * 60 * 1000;
		var dateParam = new Date(sDate);
		var year = dateParam.getFullYear();
		var month = dateParam.getMonth();
		var date = dateParam.getDate();
		return new Date(year, month, date);
	}
	function compareDate(start,end){
		start=start.replace(/-/g,"/");
		end=end.replace(/-/g,"/");
		var startTime=new Date(start).getTime();
		var endTime=new Date(end).getTime();
		var iDays=parseInt((endTime-startTime)/1000/60/60/24);
		return iDays;
	}
	$("#bookingDateStart").datepicker("setDate", initDate(0));
	$("#bookingDateEnd").datepicker("setDate", initDate(0));
	$("#flightDateStart").datepicker("setDate", initDate(0));
	$("#flightDateEnd").datepicker("setDate", initDate(0));

	if(getOrderManageOperation && !numbers){
		Session.deleteObject("orderManageOperation");
	}
	if(getHomeOperation && !numbers){
		Session.deleteObject("getHomeOperation");
	}

 	if(numbers != null){
// 		if(numbers.length > 3){
// 			$("#addSearch").trigger("click");
// 		}
 		$.each(numbers,function(i,number){
   			if (i == 0) {
   				$("#searchBox select[name='selectOorA']").val(number.type);
   				if ("A" == number.type) {
   					$("#awbNo").show().val(number.value).css("color","#000000");
   					$("#awbNo")[0].style.fontStyle = "normal";
   					$("#orderId").hide();
   				} else {
   					$("#orderId").show().val(number.value).css("color","#000000");
   					$("#orderId")[0].style.fontStyle = "normal";
   					$("#awbNo").hide();
   				}
					 VERIFY_IMAGE_POINT_X = number.point;
					 console.log('number_point:' + VERIFY_IMAGE_POINT_X)
				 }else if(i == 1) {
   				if (number.id == "flightNo"){
   					$("#searchBox input[id='"+ number.id +"']").val(number.value);
   				}
   			}else{
					$("#bookingDateStart").datepicker("setDate", (number.bookingDateStart ? number.bookingDateStart : initDate(0)));
					$("#bookingDateEnd").datepicker("setDate", (number.bookingDateEnd ? number.bookingDateEnd : initDate(0)));
					$("#flightDateStart").datepicker("setDate", (number.flightDateStart ? number.flightDateStart : initDate(0)));
					$("#flightDateEnd").datepicker("setDate", (number.flightDateEnd ? number.flightDateEnd : initDate(0)));
					// if(number.bookingDateStart){
					// 	$("#bookingDateStart").datepicker("setDate", number.bookingDateStart);
					// }else{
					// 	$("#bookingDateStart").datepicker("setDate", initDate(0));
					// }
					// if(number.bookingDateEnd){
					// 	$("#bookingDateEnd").datepicker("setDate", number.bookingDateEnd);
					// }else{
					// 	$("#bookingDateStart").datepicker("setDate", initDate(0));
					// }
					// if(number.flightDateStart){
					// 	$("#flightDateStart").datepicker("setDate", number.flightDateStart);
					// }else{
					// 	$("#flightDateStart").datepicker("setDate", initDate(0));
					// }
					// if(number.flightDateEnd){
					// 	$("#flightDateEnd").datepicker("setDate", number.flightDateEnd);
					// }else{
					// 	$("#flightDateEnd").datepicker("setDate", initDate(0));
					// }
				}
 		});
 		Session.deleteObject("numbersQueried");
	}else{
		$("#resetForm").trigger("click");
	}
	  	
 	if (getPostfixCache != null) {
 		//怕有重名，所以赋值转换下
   		var data = getPostfixCache;
   		render("intDomTemplate",data,"#selectOrderModal");
   		base.myModalFun($("#selectOrderModal"),"show");
 	}
 	
	if (doQueryCache != null && doQueryCache.length != 0) {
		//怕有重名，所以赋值转换下
		// var data = doQueryCache;
		// render("cargoTrackingTemplate",data,".cargo-tracking");
		// $(".tab-nav li:first, .tab-content div:first").addClass("active");
		Session.deleteObject("doQuery");
	}

	if (getOrderManageOperation) {
		$("#tracking-title").html("查看物流").show();
		$("#tracking-search").hide();
		DO_QUERY_URL = "../cargotracking/queryCargoInfoLogin.do";
		doQuery();
	}else{
		$("#tracking-title").html("货物跟踪").show();
		$("#tracking-search").show();
		if(getHomeOperation){
			if(Store.loadObject("userId")){
				// 用户登录  先验证是否本人/是否本企业用户/是否本代理人
				DO_QUERY_URL = "../cargotracking/queryCargoInfoAll.do";
			}else{  
				//  用户未登录 
				DO_QUERY_URL = "../cargotracking/queryCargoInfo.do";
			}
			var selectOorA = $("select[name='selectOorA']").val();
			if(selectOorA === 'A' && awbNo){
				var hasIntDom = getPostfix();
				if(!hasIntDom){
					doQuery();
				}
			}else{
				doQuery();
			}
		}
	}
	
	// 新增查询订单号
//  $("#addSearch").on("click",function(){
//      var searchLists = $("#searchLists"),searchSize = $("#searchBox").find(".search-select-box").size();
//      if(searchLists.hasClass("hidden")){
//          searchLists.removeClass("hidden");
//      }
//  });
//  $("#searchLists").delegate(".del","click",function(){
//      $(this).parent().addClass("hidden");
//      $("#searchLists input").val("").removeAttr("data-value").removeAttr("data-postfix")
//      .attr("data-pattern",pattern.O);
//      $("#searchLists select").val("O");
//  });
     

//	//查询货物信息
//  $("#freightTrackSubmit").click(function(){
//  	var verify = verfiyAllQueryInputs($("#searchForm"));
//  	if(!verify){
//  		return false;
//  	}
//  	$("#searchBox input").each(function(){
//  		$(this).attr("data-value",formateAwbNo($(this).val()));
//  	});
//  	var hasIntDom = getPostfix();
//  	if(!hasIntDom){
//  		doQuery();
//  	}
//  });
		    /**
		 * 调用模态框
		 * @function myModalFun           生成新的提示框并添加到文档
		 * @param {object} target         目标对象
		 * @param {string} operate        对目标进行的操作
		 * */
		function myModalFun(target,operate){
				if(operate == "show"){
						target.show().addClass("in").find(".modal-backdrop").addClass("in");
				}else{
						target.removeClass("in");
						// setTimeout(function(){
						target.hide().find(".modal-backdrop").removeClass("in");
						// },100);
				}
		}

		function initYzm() {
			$("#xy_img").css("display", "none");
			$(".yzm_image_cut_big").css("display", "none");
			$(".yzm_image_cut_loading").show();
				$.ajax({
					type:"POST",
					url: "../cargotracking/getCaptcha.do",
					data: {},
					dataType:"JSON",
					async: false,
					success:function(res){
						console.log(res)
						// var result =  {"smallImgName":"20200526_small_7d9f570460bb5184.png","bigImgName":"20200526_big_a4d31cf97b890c05.png","sourceImgName":"4.png","location_y":"6"}
						if (res.success) {
							var data = res.returnObject;
							if(data){
								//设置大图，小图，及其位置
								$(".yzm_image_cut_big").css("background-image", 'url("../cargotracking/tempImg/' + data.bigImgName + '")');

								$("#xy_img").css("background-image", 'url("../cargotracking/tempImg/' + data.smallImgName + '")');
								$("#xy_img").css("top", Number(data.location_y) + "px");
								$(".yzm_image_cut_loading").css("display", "none");
								$("#xy_img").show()
								$(".yzm_image_cut_big").show()
							}else{
								$(".form-item").css("display", 'none');
								$("#fieldMsg").css("display", 'block');
							}
							
						}else {
							$(".form-item").css("display", 'none');
							$("#fieldMsg").css("display", 'block');
						}					
					},
					error: function(err) {
						$(".form-item").css("display", 'none');
						$("#fieldMsg").css("display", 'block');
					}
				});

		}
		function fun_imageVerify(callback){
			var DRAG = $('#drag').drag();
			var html = DRAG.modalHtml("../");
			$("#mod-imageVerify").remove();
			$("body").append(html);
			myModalFun($("#mod-imageVerify"),"show");
			// $("#mod-imageVerify").find(".modal-body").html(html)
			//初始化图形验证码
			initYzm();
			//注册验证码拖动事件
			$('#drag').drag(null, null, initYzm, function (result) {
				VERIFY_IMAGE_POINT_X = null;
				if (result) {
					VERIFY_IMAGE_POINT_X = result;
					myModalFun($("#mod-imageVerify"),"hide");
					callback();
				}
			});
		}
		// 刷新图形验证码
		$(document).on("click","#refreshyzm",function(){
				initYzm();
		})

    //查询货物信息
    $("#searchFormSubmit").click(function(){
			var orderId = $("#orderId").val();
			var awbNo = $("#awbNo").val();
			var flightNo = $("#flightNo").val();
			var selectOorA = $("select[name='selectOorA']").val();
			// var captcha = $("#captcha").val();

			
			if((selectOorA === 'O' && orderId) || (selectOorA === 'A' && awbNo)){
				if(selectOorA === 'O'){
					if(!/^C[0-9]{14}$/.test(orderId)){
						base.showDialog({content:"请输入正确的订单号！"});
						return false
					}
				}else{
					if(!/^([0-9]{3}-?)?[0-9]{8}$/.test(awbNo)){
						base.showDialog({content:"请输入正确的运单号！"});
						return false
					}
				}
				if(flightNo && !/^([0-9a-zA-Z]{2})+([0-9]{1,4})+([a-zA-Z]{0,1})$/.test(flightNo)){
					base.showDialog({content:"请输入正确的航班号！"});
					return false
				}
				// if(!/^[\S\s]{1,6}$/.test(captcha)){
				// 	base.showDialog({content:"请输入正确的验证码！"});
				// 	return false
				// }

				$("#searchBox input").each(function(){
					$(this).attr("data-value",formateAwbNo($(this).val()));
				});
				if(Store.loadObject("userId")){
					// 用户登录  先验证是否本人/是否本企业用户/是否本代理人
					DO_QUERY_URL = "../cargotracking/queryCargoInfoAll.do";
				}else{  
					//  用户未登录 
					DO_QUERY_URL = "../cargotracking/queryCargoInfo.do";
				}
				var fun_imageVerifyCallBack = function(){
					if(selectOorA === 'A' && awbNo){
						var hasIntDom = getPostfix();
						if(!hasIntDom){
							doQuery();
						}
					}else{
						doQuery();
					}
				}
				fun_imageVerify(fun_imageVerifyCallBack)

			}else{
				if(Store.loadObject("userId")){
					// if(Store.loadObject("userType") != 'C'){
					// 	base.showDialog({content:"目前只有B2C的用户登录后能继续使用货物跟踪功能"});
					// 	return false;
					// }
					var bookingDateStart = $("#bookingDateStart").val();
					var bookingDateEnd = $("#bookingDateEnd").val();
					var bookingCompare = compareDate(bookingDateStart, bookingDateEnd);
					if(bookingCompare<0){
						base.showDialog({content:"订舱日期开始日期不可晚于结束日期"});
						return false;
					}else if(bookingCompare>=14){
						base.showDialog({content:"订舱日期范围不能超过14天"});
						return false;
					}
					var flightDateStart = $("#flightDateStart").val();//航班开始日期
					var flightDateEnd = $("#flightDateEnd").val();//航班结束日期
					var flightCompare=compareDate(flightDateStart,flightDateEnd);
					if(flightCompare<0){
						base.showDialog({content:"航班开始日期不可晚于结束日期"});
						return false;
					}else if(flightCompare>=3){
						base.showDialog({content:"航班日期范围不能超过3天"});
						return false;
					}
					if(flightNo && !/^([0-9a-zA-Z]{2})+([0-9]{1,4})+([a-zA-Z]{0,1})$/.test(flightNo)){
						base.showDialog({content:"请输入正确的航班号！"});
						return false
					}
					DO_QUERY_URL = "../cargotracking/queryCargoInfoAll.do";
					var fun_imageVerifyCallBack = function(){
						doQuery();
					}
					fun_imageVerify(fun_imageVerifyCallBack);

					// if(!/^[\S\s]{1,6}$/.test(captcha)){
					// 	base.showDialog({content:"请输入正确的验证码！"});
					// 	return false
					// }
					// 用户登录  先验证是否本人/是否本企业用户/是否本代理人
					
				}else{
					base.showDialog({content:"请登录后查询货物信息！"});
				}
			}

		});
		//清空
		$("#resetForm").on("click" , function(){
			$("#searchForm")[0].reset();
			$("#bookingDateStart").datepicker("setDate", initDate(0));
			$("#bookingDateEnd").datepicker("setDate", initDate(0));
			$("#flightDateStart").datepicker("setDate", initDate(0));
			$("#flightDateEnd").datepicker("setDate", initDate(0));
			$.each($("#searchBox li") , function(){
				if($(this).hasClass("has-error")){
					$(this).removeClass("has-error");
				}
			});
		});
    //检验输入，包括正则、不全为空、不可重复输入
//	function verifyNumbers(){
//		$("#searchBox select").each(function(){
//			if($(this).val() == "O"){
//	  			$(this).next().attr("data-pattern",pattern.O);
//		   	}else if($(this).val() == "A"){
//	   			$(this).next().attr("data-pattern",pattern.A);
//		   	}
//		});
//		$(".has-error").removeClass("has-error");
//		var verify = verfiyAllQueryInputs($("#searchForm"));
//		if(!verify){
//			return false;
//		}
//		
// 		var allEmpty = true;
//  	$(".search-select-box input").each(function(i){
//  		if($(this).val() != ""){
//  			allEmpty = false;
//  		}
//  	});
//  	
//  	if(allEmpty){
//  		base.showDialog({content:"请至少填写一个单号"});
//  		return false;
//  	}
//  	
// 		var duplicatedNumbers = findDuplicatedNumbers();
// 		if(duplicatedNumbers.length > 0){
// 			base.showDialog({content:"有重复的运单号/订单号，请重新输入！"});//+duplicatedNumbers.toString().replace(/,/g,"/")
// 			return false;
// 		}
// 		return true;
// 	};
     
     /*收货：      货物已接收
     配载：    货物正装机 
     发货：    航班已起飞
     目的地:    航班已到达
     收货：     货物提取*/
     
    //查询航班信息
    $("body").on("click",".showFlightInfo",function(){
    	//isLogin
    	if(Store.loadObject("userId") == null){
    		// if($(this).parents("table").next("p").length == 0){
				base.showDialog({content:"查看更多信息，请登录！"});
    			// $(this).parents(".tab-pane").find(".cargoInfo").after($("<p class='text-center'>查看更多信息，请<a class='cargoTrackingLogin'>登录</a>!</p>"));
    		// }
    		return false;
    	}
    	var flightNo = $(this).attr("data-flightNo");
    	var flightDate = $(this).attr("data-flightDate");
    	var target = $(this).parents(".tab-pane").find(".flightInfo");
    	base.ajaxRequest({
    		url:"../cargotracking/getFlight.do",
    		param:{flightNo:flightNo,flightDate:flightDate},
				contentType:"application/x-www-form-urlencoded",
				needLoader:true,
    		success:function(data){
    			data = {'flights':data};
    			render("flightInfoTemplate",data,target);
    		}
    	});
    });
     
    //刷新验证码
    // $("body").on("click","#captchaImg",function(){
    // 	refreshCaptcha();
    // });
     
    //弹出登陆窗口
    $("body").on("click",".cargoTrackingLogin",function(e){
			e.preventDefault();
			var orderId = $("#orderId").val();
			var awbNo = $("#awbNo").val();
			var flightNo = $("#flightNo").val();
			var selectOorA = $("select[name='selectOorA']").val();
			var bookingDateStart = $("#bookingDateStart").val();
			var bookingDateEnd = $("#bookingDateEnd").val();
			var flightDateStart = $("#flightDateStart").val();//航班开始日期
			var flightDateEnd = $("#flightDateEnd").val();//航班结束日期
			var arr = []
			var obj = {
				bookingDateStart:bookingDateStart,
				bookingDateEnd:bookingDateEnd,
				flightDateStart:flightDateStart,
				flightDateEnd:flightDateEnd
			}
			var obj1 = null;
			if(selectOorA == 'O'){
				obj1 = {type:'O',value:orderId}
			}else{
				obj1 = {type:'A',value:awbNo}
			}
			var arr = [obj1,{id:"flightNo",value:flightNo},obj]
			Session.saveObject("numbersQueried",arr);
			var $href = window.location.href;
    	base.showLoginBox($href);
    	//$("#loginInBtn").off("click");
    	//$("#loginInBtn").click(function(){
    		//loginIn();
    	//});
		});
		
		// 获取 货物状态信息
		function fun_getCargoStrackStatu(target){
			//isLogin
			
			var awbPrefix = target.attr("data-awbprefix");
			var awbNo = target.attr("data-awbno");
			var awbPostfix = target.attr("data-awbPostfix");
			base.ajaxRequest({
				url:"../cargotracking/status.do",
				param:{'awbPrefix':awbPrefix,'awbNo':awbNo,'awbPostfix':awbPostfix},
				contentType:"application/x-www-form-urlencoded",
				needLoader:true,
				success:function(data){
					// 如果有货物状态信息 验证登录
					if(data.cargoStates && data.cargoStates.length > 0){
						if(Store.loadObject("userId") == null){
							$(".userNotlogin").show()
						}else{
							$(".userNotlogin").hide()
						}
					}

					data = {'data':data};
					render("cargoStateTemplate",data,target.parents(".tab-pane").find(".cargoState"));
					render("shipmentInfoTemplate",data,target.parents(".tab-pane").find(".shipmentInfo"));
				}
			});
		}
     
    //查询货物状态信息
    $("body").on("click",".newState",function(){
			if(Store.loadObject("userId") == null){
				// if($(".cargoTrackingLogin").length == 0){
				base.showDialog({content:"查看更多信息，请登录！"});
					// $(".cargoInfo").after($("<p class='text-center'>查看更多信息，请<a class='cargoTrackingLogin'>登录</a>!</p>"));
				// }
				return false;
			}
			var target = $(this);
			fun_getCargoStrackStatu(target);
    });
     
    //渲染函数，参数列表为模板id、渲染数据、需要appendTo的对象或选择符。可用于货物信息、航班信息、货物状态信息渲染
    function render(tpl,data,target){
    	$(target).empty();
    	var html = template(tpl,data);
    	$(target).append(html);
    }
     
     //同一单号同时存在国内国际运单的情况弹框提供选择
    $(document).on("click","#selectOrderModal .btn-primary",function(){
    	var hasUnchoosed = false;
        $("#selectOrderModal [type='radio']").each(function(){
        	if($("#selectOrderModal").find("[name='"+$(this).attr("name")+"']:checked").length == 0){
        		hasUnchoosed = true;
        		return false;
        	}
        });
        if(hasUnchoosed){
        	return false;
        }
    	var numberIntDomEle = $(this).parents(".modal").find("tbody tr");
    	numberIntDomEle.find("input:checked").each(function(){
    		 $("#awbNo").attr("data-postfix",$(this).val());
    	});
     	//var postfix = $(".modal [name='selectOrder']:checked").val();
     	
     	var myModal = $(this).parents(".modal");
        myModal.removeClass("in");
        setTimeout(function(){
            myModal.hide().find(".modal-backdrop").removeClass("in");
        },100);
        
        $("#selectOrderModal").empty();
        doQuery();
     });
     
 	
 	//找出输入的单号中重复的值
// 	function findDuplicatedNumbers(){
// 		var duplicatedNumbers = [];
// 		var numberEles = $("#searchBox input");
// 		numberEles.each(function(i){
// 			var target = $(this);
// 			if(target.val() == ""){
// 				return true;
// 			}
// 			var isTargetExisted = false;
// 			$.each(duplicatedNumbers,function(i,n){
// 				if(target.val() != n){
// 					return true;
// 				}
// 				isTargetExisted = true;
// 			});
// 			//当前输入框的值已存在于重复值数组，直接跳过判断处理
// 			if(isTargetExisted){
// 				return true;
// 			}
// 			numberEles.each(function(j){
// 				if(j > i){
//	 				var theOther = $(this);
//	 				if(target.val() == theOther.val()){
//	 					duplicatedNumbers.push(target.val());
//	 					return false;
//	 				}
// 				}
// 			});
// 		});
// 		return duplicatedNumbers;
// 	}

 	//获取运单后缀,若有结果则返回true
 	function getPostfix(){
 		var awbs = [];
// 		var numberEles = $("#searchBox input");
// 		numberEles.each(function(){
// 			var target = $(this);
// 			if(target.prev().val() == "A" && target.val() != ""){
// 				var awbPrefix = target.val().substring(0,3);
// 				var awbNo = target.val().indexOf("-") != -1 ? target.val().substring(4) : target.val().substring(3);
// 				awbs.push({'awbprefix':awbPrefix,'awbno':awbNo});
// 			}
// 		});
		var selectOorA = $("select[name='selectOorA']").val();
		var awbNo = $("#awbNo").val();
		var awbPrefix = "784"
		if (selectOorA == "A" && awbNo != "") {
			if(awbNo.length > 8){
				if(awbNo.indexOf("-") != -1){
					var awbArr = awbNo.split("-");
					awbPrefix = awbArr[0];
					awbNo = awbArr[1];
				}else{
					awbPrefix = awbNo.substr(0,3);
					awbNo = awbNo.substr(3);
				}
			}
			awbs.push({'awbprefix':awbPrefix,'awbno':awbNo});
		}

 		var hasIntDom = false;
 		// var captcha = $("#captcha").val();
		// if(VERIFY_IMAGE_POINT_X){
		// 	awbs.point = VERIFY_IMAGE_POINT_X;
		// }
 		base.ajaxRequest({
 			url:"../cargotracking/GetAwb.do?point="+VERIFY_IMAGE_POINT_X,
 			param:awbs,
 			//contentType:"application/x-www-form-urlencoded",
 			async:false,
 			needDeal:true,
     		timestamp:false,
 			success:function(data){
 				if(!data.success){
     				if(data.exceptionMessage == "验证码错误" 
     					|| data.exceptionMessage == "验证码已失效" || data.exceptionMessage == "验证码无效"){
     					// $("#captcha").parent().parent().addClass("has-error");
     					// $("#captcha").val($("#captcha").attr("data-errorTips"));
							base.showDialog({content:"验证码无效，请重新验证！"});
							return false;
     				}else{
     					base.showDialog({content:"系统错误，请联系管理员"});
     				}
     				return false;
     			}
 				data = data.returnObject;
				for(var i = 0; i < data.length; i++){
					var item = data[i];
					if(item.awbBasics.length == 1){
						var awbBasic = item.awbBasics[0];
						var awb = awbBasic.awbprefix + awbBasic.awbno;
//						$("[data-value="+awb+"]").attr("data-postfix",awbBasic.awbpostfix);
						$("#awbNo").attr("data-postfix",awbBasic.awbpostfix)
						//删掉，该单号非国内国际同号，无需展示
						data.splice(i--,1);
					}else if(item.awbBasics.length == 2){
						hasIntDom = true;
					}
				}
 				if(hasIntDom){
 					data = {'data':data};
 					render("intDomTemplate",data,"#selectOrderModal");
 					base.myModalFun($("#selectOrderModal"),"show");	
 				}
 			}
 		});
 		return hasIntDom;
 	}
 	
 	//查询货物信息
 	function doQuery(){
// 		var numbers = [];
//   	$("#searchBox .search-select-box").each(function(i){
//   		var number = {};
//   		number.type = $(this).find("select").val();
//   		if(number.type == "O"){
//   			number.orderID = $(this).find("input").val();
//   		}else if(number.type = "A"){
//   			var awbPrefixAndNo = $(this).find("input").val();
//   			number.awbPrefix = awbPrefixAndNo.substring(0,3);
// 				number.awbNo = awbPrefixAndNo.indexOf("-") != -1 ? awbPrefixAndNo.substring(4) : awbPrefixAndNo.substring(3);
//   			number.awbPostfix = $(this).find("input").attr("data-postfix");
//   			if(!number.awbPostfix){
//   				number.awbPostfix = "NoData";
//   			}
//   		}
//   		if($(this).find("input").val() != ""){
//   			numbers.push(number);
//   		}
//   	});

		var numbers = new Object();
		var orderId = $("#orderId").val()
		var awbNo = $("#awbNo").val();
		var type = $("#searchBox").find("select").val();
		numbers.flightNo = $("#flightNo").val();
		if((type == "O" && orderId) || (type == "A" && awbNo)){
			numbers.type = type
			if (type == "O") {
				numbers.orderID = $("#orderId").val();
			} else if (type == "A") {
				var awbPrefixAndNo = $("#awbNo").val();
				var awbPrefix = "784"
				var awbNo = awbPrefixAndNo
				if(awbPrefixAndNo.length > 8){
					if(awbPrefixAndNo.indexOf("-") != -1){
						var awbArr = awbPrefixAndNo.split("-");
						awbPrefix = awbArr[0];
						awbNo = awbArr[1];
					}else{
						awbPrefix = awbPrefixAndNo.substr(0,3);
						awbNo = awbPrefixAndNo.substr(3);
					}
				}
				numbers.awbPrefix = awbPrefix;
				numbers.awbNo = awbNo;
				numbers.awbPostfix = $("#awbNo").attr("data-postfix");
				if(!numbers.awbPostfix){
					 numbers.awbPostfix = "NoData";
				 }
			}
		}else{
			numbers.bookTimeBegin = $.trim($("#bookingDateStart").val())+" 00:00:00";
			numbers.bookTimeEnd = $.trim($("#bookingDateEnd").val())+" 00:00:00";
			numbers.planFlightTimeBegin = $.trim($("#flightDateStart").val())+" 00:00:00";
			numbers.planFlightTimeEnd = $.trim($("#flightDateEnd").val())+" 00:00:00";
		}
		// var captcha = $("#captcha").val();
		// numbers.point = VERIFY_IMAGE_POINT_X;
		console.log(numbers)
		base.ajaxRequest({
			// url:DO_QUERY_URL+"?captcha="+captcha,
			url:DO_QUERY_URL+"?point="+VERIFY_IMAGE_POINT_X,
			param:numbers,
			needLoader:true,
			needDeal:true,
			timestamp:false,
			success:function(data){
				// $("#captchaErrorMsg").text("");
				// refreshCaptcha();
				if(!data.success){
					if(data.exceptionMessage == "验证码错误" || data.exceptionMessage == "验证码已失效" || data.exceptionMessage =="验证码无效"){
						// $("#captcha").parent().parent().addClass("has-error");
						// $("#captcha").val($("#captcha").attr("data-errorTips"));
						base.showDialog({content:"验证码无效，请重新验证！"});
					}else if (data.exceptionMessage =="订单号或运单号匹配对应的航班号失败") {
						var data = {'data':[]};
						render("cargoTrackingTemplate",data,".cargo-tracking");
					}else if ((data.exceptionMessage && data.exceptionMessage.indexOf("航班号不匹配，请重新输入") != -1) || data.exceptionMessage == "您没有权限查询此单的货物状态！") {
						base.showDialog({content:data.exceptionMessage});
					}else{
						base.showDialog({content:"系统错误，请联系管理员"});
					}
					return false;
				}
				var returnObject = data.returnObject;
				//var states = ['运单已接收。','货物已接收。','货物已安检。','货物正装机。','货物被拉下。','货物已装机。','航班已起飞。','航班已到达。','已通知提货。','货物已提取。'];
				// returnObject.resultOther.result = [
				// 	{"orderId":"C20191021000037","awbPrefix":"784","awbNo":"60002143","awbPostfix":"00000000","goods":"333","flightNo":"CZ0001","flightDep":"SZX","flightDest":"PEK"},
				// 	{"orderId":"C20191021000037","awbPrefix":"784","awbNo":"60002143","awbPostfix":"00000000","goods":"3334","flightNo":"CZ0001","flightDep":"SZX","flightDest":"PEK"},
				// 	{"orderId":"C20191021000037","awbPrefix":"784","awbNo":"60002143","awbPostfix":"00000000","goods":"3335","flightNo":"CZ0001","flightDep":"SZX","flightDest":"PEK"}
				// ]
				if (getOrderManageOperation) {
					var tplData = {'data':returnObject.result};     			//懒得改模板，直接转换一下key
					render("cargoTrackingTemplate",tplData,".cargo-tracking");
					var result = returnObject.result;
					//var states = ['运单已接收。','货物已接收。','货物已安检。','货物正装机。','货物被拉下。','货物已装机。','航班已起飞。','航班已到达。','已通知提货。','货物已提取。'];
					for(var i = 0;i < result.length; i++){
						var info = result[i];
						if(info.isData == "N"){
							continue;
						}
						var state = info.cargoShowStatus;
						switch(state){
							case "运单已接收。":break;
							case "货物已接收。":
							case "货物已安检。":info.stateStyle = "starting-receiving";break;
							case "货物正装机。":
							case "货物被拉下。":
							case "货物已装机。":info.stateStyle = "stowage";break;
							case "航班已起飞。":info.stateStyle = "sendout";break;
							case "航班已到达。":
							case "已通知提货。":info.stateStyle = "destination";break;
							case "货物已提取。":info.stateStyle = "receiving";break;
							default:
								if(state.indexOf("待提取") == -1){
									if(state.indexOf("提取") != -1){
										info.stateStyle = "receiving";
									}
								}
								break;
						}
					}

					var targetCon = $(".cargo-tracking").find(".tab-box:first");			
					targetCon.addClass("active");	
					targetCon.siblings(".tab-box").removeClass("active");
	
					var $target = targetCon.find(".tab-content");
					if(Store.loadObject("userId") == null){   //判断未登录 只展示运单的货物状态和货物信息
						var data = {'cargo':result[0],'exchangeAndFile':null};     			//懒得改模板，直接转换一下key
						render("oneInfoTemplate",data, $target);
						$target.find(".userNotlogin").show()
						$target.find(".awbInfoCon").hide()
					}else{
						var data = {'cargo':result[0],'exchangeAndFile':returnObject.exchangeAndFile};     			//懒得改模板，直接转换一下key
						render("oneInfoTemplate",data, $target);
	
						$target.find(".userNotlogin").hide();
	
						if(returnObject.exchangeAndFile){
							$target.find(".awbInfoCon").show()
						}else{
							$target.find(".awbInfoCon").hide()
						}
					}			
					// var $reserveShowFlightInfo = $(".showFlightInfo:eq(0)");
					// var $practicalShowFlightInfo = $(".showFlightInfo:eq(1)");
					// var $newState = $(".newState");
					// if ($reserveShowFlightInfo.attr("data-flightNo") != "" && $reserveShowFlightInfo.attr("data-flightDate") != "") {
					// 	$reserveShowFlightInfo.trigger("click");
					// } else if ($practicalShowFlightInfo.attr("data-flightNo") != "" && $practicalShowFlightInfo.attr("data-flightDate") != "") {
					// 	$practicalShowFlightInfo.trigger("click");
					// } else {
					// 	$reserveShowFlightInfo.trigger("click");
					// }
					// if ($newState.attr("data-awbPrefix") != "" && $newState.attr("data-awbNo") != "" && $newState.attr("data-awbPostfix") != "") {
					// 	$newState.trigger("click");
					// }
					Session.deleteObject("orderManageOperation");

				}else{
					var data = {'data':returnObject.resultOther.result};     			//懒得改模板，直接转换一下key
					console.log(returnObject.resultOther.result)
					render("cargoTrackingTemplate",data,".cargo-tracking");
					if(returnObject.resultOther.result && returnObject.resultOther.result.length == 1){
						var obj = returnObject.resultOther.result[0]
						var reqObj = {
							awbPrefix:obj.awbPrefix,
							awbNo:obj.awbNo,
							awbPostfix:obj.awbPostfix,
							flightDep: obj.flightDep,
							flightDest: obj.flightDest,
							flightNo: obj.flightNo
						}
						var targetCon = $(".cargo-tracking").find(".tab-box:first");
						
						fun_queryOneInfo(reqObj, targetCon);
						
					}	
				}	
				// if(Store.loadObject("userId") == null){
				// 	targetCon.find(".userNotlogin").show()
				// }else{
				// 	targetCon.find(".userNotlogin").hide()
				// }

			}
		});
	}
	
	function fun_queryOneInfo(reqObj, targetTabBox){
		base.ajaxRequest({
			url:"../cargotracking/queryOneInfo.do",
			param:reqObj,
			needLoader:true,
			needDeal:true,
			timestamp:false,
			success:function(data){
				if(!data.success){
					if(data.exceptionMessage == "验证码错误" || data.exceptionMessage == "验证码已失效" || data.exceptionMessage == "验证码无效"){
						// $("#captcha").parent().parent().addClass("has-error");
						// $("#captcha").val($("#captcha").attr("data-errorTips"));
						base.showDialog({content:"验证码无效，请重新验证！"});
					} else if (data.exceptionMessage && (data.exceptionMessage.indexOf("航班号不匹配，请重新输入") != -1)){
						base.showDialog({content:data.exceptionMessage});
					} else{
						base.showDialog({content:"系统错误，请联系管理员"});
					}
					
					return false;
				}
				var returnObject = data.returnObject;
				var result = returnObject.result;
				//var states = ['运单已接收。','货物已接收。','货物已安检。','货物正装机。','货物被拉下。','货物已装机。','航班已起飞。','航班已到达。','已通知提货。','货物已提取。'];
				for(var i = 0;i < result.length; i++){
					var info = result[i];
					if(info.isData == "N"){
						continue;
					}
					var state = info.cargoShowStatus;
					switch(state){
						case "运单已接收。":break;
						case "货物已接收。":
						case "货物已安检。":info.stateStyle = "starting-receiving";break;
						case "货物正装机。":
						case "货物被拉下。":
						case "货物已装机。":info.stateStyle = "stowage";break;
						case "航班已起飞。":info.stateStyle = "sendout";break;
						case "航班已到达。":
						case "已通知提货。":info.stateStyle = "destination";break;
						case "货物已提取。":info.stateStyle = "receiving";break;
						default:
								if(state.indexOf("待提取") == -1){
									if(state.indexOf("提取") != -1){
										info.stateStyle = "receiving";
									}
								}
							break;
					}
				}
								
				targetTabBox.addClass("active");	
				targetTabBox.siblings(".tab-box").removeClass("active");

				var $target = targetTabBox.find(".tab-content");
				if(Store.loadObject("userId") == null){   //判断未登录 只展示运单的货物状态和货物信息
					var data = {'cargo':result[0],'exchangeAndFile':null};     			//懒得改模板，直接转换一下key
					render("oneInfoTemplate",data, $target);
					$target.find(".userNotlogin").show()
					$target.find(".awbInfoCon").hide()
				}else{
					/*
					returnObject.exchangeAndFile = {
						actype: 'string',
						agentCode: 'CANBTC',
						agentName: 'string',
						awbNo: 'string',
						awbOpDateStr: '11-10 17:46',
						awbPostfix: 'string',
						awbPrefix: 'string',
						bookFlightDate: '2019-11-10T17:46:30.811Z',
						bookFlightNo: 'string',
						bookGrade: 'string',
						bookId: 'string',
						bookVolume: 0,
						cargoExchangeStatus: '未检查',
						cweight: 0,
						fileRemark: 'string',
						flightDate: '2019-11-10T17:46:30.812Z',
						flightDep: 'string',
						flightDepCnName: 'string',
						flightDepTime: '2019-11-10T17:46:30.812Z',
						flightDest: 'CAN',
						flightDestCnName: 'string',
						flightTransfer: 'string',
						goods: '测试品名哈哈哈呵呵呵和恶化',
						handlingInfo: 'string',
						hasRed: true,
						liStatus: '未检查',
						piece: 0,
						routing: 'string',
						routingStr: 'string',
						segmentType: 'KK',
						weight: 0,
						xssposition: 'A,B',
						checkResultStr:'未检查'
					}*/
					var data = {'cargo':result[0],'exchangeAndFile':returnObject.exchangeAndFile};     			//懒得改模板，直接转换一下key
					render("oneInfoTemplate",data, $target);

					$target.find(".userNotlogin").hide();

					if(returnObject.exchangeAndFile){
						$target.find(".awbInfoCon").show()
					}else{
						$target.find(".awbInfoCon").hide()
					}
				}

				//$(".tab-nav li:first, .tab-content div:first").addClass("active");

			}
		});
	}
	 //点击展开/收起 内容
	$(".cargo-tracking").on("click",".tab-title",function(){
			var $awbPrefix = $.trim($(this).attr("data-awbprefix")),
					$awbNo = $.trim($(this).attr("data-awbNo")),
					$awbPostfix = $.trim($(this).attr("data-awbpostfix")),
					$flightDep = $.trim($(this).attr("data-flightDep")),
					$flightDest = $.trim($(this).attr("data-flightDest")),
					$flightNo = $.trim($(this).attr("data-flightNo")),
					$flightDate = $.trim($(this).attr("data-flightDate"));
			var reqObj = {
				awbPrefix:$awbPrefix,
				awbNo:$awbNo,
				awbPostfix:$awbPostfix,
				//flightDate: $flightDate +" 00:00:00",
				flightDep: $flightDep,
				flightDest: $flightDest,
				flightNo: $flightNo
			}
			var targetCon = $(this).parents(".tab-box");
			var $hasClass = targetCon.hasClass("active");
			if($hasClass){
				targetCon.removeClass("active");
			}else{
				fun_queryOneInfo(reqObj, targetCon);
			}
	});

	// 点击列表右边箭头按钮 展开/收起 内容
	// $(".cargo-tracking").on("click",".tab-arrow",function(event){
	// 		var $tab_box = $(this).parents(".tab-box");
	// 		var $hasClass = $tab_box.hasClass("active");
	// 		if($hasClass){
	// 			$tab_box.removeClass("active");
	// 		}else{
	// 			$tab_box.addClass("active");
	// 			$tab_box.siblings(".tab-box").removeClass("active");
	// 		}
	// 		event.stopPropagation();
	// })
	 
	var PRINT_DATA = null
	//点击打印
	$(".cargo-tracking").on("click",".print-btn",function(){
		PRINT_DATA = null;
		var $con = $(this).parents(".tab-box").find(".tab-title");
		var $awbPrefix = $.trim($con.attr("data-awbPrefix")),
				$awbNo = $.trim($con.attr("data-awbNo")),
				$awbPostfix = $.trim($con.attr("data-awbPostfix")),
				$flightDep = $.trim($con.attr("data-flightDep")),
				$flightDest = $.trim($con.attr("data-flightDest")),
				$flightNo = $.trim($con.attr("data-flightNo")),
				$flightDate = $.trim($con.attr("data-flightDate"));

			PRINT_DATA = {"awbPrefix":$awbPrefix,"awbNo":$awbNo,"awbPostfix":$awbPostfix,"flightDep":$flightDep,"flightDest":$flightDest,"flightNo":$flightNo,"flightDate":$flightDate}

			var data = {"list":[{name:'交接单',id:0},{name:'锂电池运输说明',id:1}]
			}
			render("selectPrintFileTemplate",data,"#selectPrintFileModal");
			base.myModalFun($("#selectPrintFileModal"),"show");
	});
	//取消打印
	$("#selectPrintFileModal").on("click",".cancelSelectPrintFile",function(){
		base.myModalFun($("#selectPrintFileModal"),"hide");
	});
	// 打印弹框 选择打印的文件
	$("#selectPrintFileModal").on("click","input[type=checkbox]",function(){
		if($(this).prop('checked')){
			var $siblingIpt = $(this).parent("li").siblings().find("input");
			if($siblingIpt.prop('checked')){
				$siblingIpt.prop('checked',false);
			}
		}

	})
	//确定打印
	$("#selectPrintFileModal").on("click",".sureSelectPrintFile",function(){
		var $selectVal = $("#selectPrintFileModal").find("input[type=checkbox]:checked").val();
		if($selectVal){
			if(parseInt($selectVal) == 0){
				window.open('tangb2cweb/pages/printDeliveryReceipt?awbprefix='+PRINT_DATA.awbprefix+'&awbno='+PRINT_DATA.awbNo+'&awbpostfix='+PRINT_DATA.awbPostfix);
			}
			if(parseInt($selectVal) == 1){
				window.open('tangb2cweb/pages/printLithiumBattery?awbprefix='+PRINT_DATA.awbprefix+'&awbno='+PRINT_DATA.awbNo+'&awbpostfix='+PRINT_DATA.awbPostfix+'&flightNo='+PRINT_DATA.flightNo);
			}
		}else{
			var $hasClass = $("#selectPrintFileModal").find(".modal-content").hasClass("shake");
			if(!$hasClass){
				$("#selectPrintFileModal").find(".modal-content").addClass("shake");
			}
			setTimeout(function(){
				$("#selectPrintFileModal").find(".modal-content").removeClass("shake");
			},200)
		}
	});

 	//刷新验证码
  //   function refreshCaptcha(){
 	// 	var src = $("#captchaImg").attr("src");
 	// 	var indexOfTime = src.indexOf("time",0);
 	// 	if(indexOfTime != -1){
 	// 		src = src.substring(0,indexOfTime - 1);
 	// 	}
 	// 	$("#captchaImg").attr("src", src + "&time=" + new Date().getTime());
 	// }
 	
    function verfiyQueryInput(target){
        target.css("border-color","#cccccc");
     	var content=target.val(),errorCount=0;
        var isRequired=target.is("[data-required]");
        var pattern = new RegExp(target.attr("data-pattern"));
        var result = pattern.test(content); // 正则表达式的结果;
        if(content==""){
            if(isRequired) errorCount++;
        }else{
            if(!result) { 
            	errorCount++;
            }else if( target.prev().val() == "A"){
				//单号最后一位校验
					var awbPrefix = "784"
					var awbNo = content
					if(content.length > 8){
						if(content.indexOf("-") != -1){
							var awbArr = content.split("-");
							awbPrefix = awbArr[0];
							awbNo = awbArr[1];
						}else{
							awbPrefix = content.substr(0,3);
							awbNo = content.substr(3);
						}
					}
    			var checkBit = awbNo.charAt(7);
            	if(parseInt(checkBit) != parseInt(awbNo.substring(0,7)) % 7){
    				errorCount++;
    			}
            }
        }
        
        /*var isAboveZero=target.attr("data-aboveZero");
        if(null!=isAboveZero && (isAboveZero||isAoveZero=="true")){
            if(content=="0"||content=="0.0"||content=="0.00"){
            	errorCount++;
            }
        }*/
        
        if(errorCount>0){
        	target.css("border-color","#cc3333");
        	target.parent().parent().addClass("has-error");
       	    var dataErrorTips=target.attr("data-errorTips");
       	    if(null!=dataErrorTips && ""!=dataErrorTips){
       			target.val(dataErrorTips);
       		}
         	return false;
        }
         	
        return true;
    }
    
    //校验查询输入框的所有内容
    function verfiyAllQueryInputs(form){
        var patterns=form.find("input[data-pattern]"),errorCount=0;
        patterns.each(function(){
            var target=$(this);
            if(!verfiyQueryInput(target)) errorCount++;
        });
        if(errorCount>0) return false;
        return true;
    }
    
//  $("input[data-pattern]").focus(function(){
//  	var target=$(this);
//  	target.css("border-color","#cccccc");
//  	var thisVal=target.val();
//  	var dataErrorTips=target.attr("data-errorTips");
//  	
//  	if(null!=dataErrorTips && ""!=dataErrorTips &&(thisVal==dataErrorTips)){
//			target.val("");
//		}
//  });
    
    //支持传入xxx-xxxxxxxx xxxxxxxxxxx 返回xxxxxxxxxxx
    function formateAwbNo(awbNo){
   		return awbNo.replace("-","");
    }
    
    $("select[name='selectOorA']").on("change",function(){
		var selectVal = $(this).val();
		if ("A" == selectVal) {
			$("#awbNo").show();
			$("#orderId").hide();
		} else {
			$("#orderId").show();
			$("#awbNo").hide();
		}
	});
	
	
    $("#searchForm").on("blur","input",function(){
    	base.verifyOneField($(this));
    });
    
    // 这个要放到后面这个位置，要等.showFlightInfo和.newState的事件加载完毕后才有效果
    // 暂时这样用
    // if (getOrderManageOperation != null && getOrderManageOperation) {
    	//从订单管理查看物流入口进入的不用显示条件输入项
    	// $("#searchForm").hide(); 
    	
    	// $("h3").html("查看物流");
    	
    	// var $reserveShowFlightInfo = $(".showFlightInfo:eq(0)");
    	// var $practicalShowFlightInfo = $(".showFlightInfo:eq(1)");
    	// var $newState = $(".newState");
    	// if ($reserveShowFlightInfo.attr("data-flightNo") != "" && $reserveShowFlightInfo.attr("data-flightDate") != "") {
    	// 	$reserveShowFlightInfo.trigger("click");
    	// } else if ($practicalShowFlightInfo.attr("data-flightNo") != "" && $practicalShowFlightInfo.attr("data-flightDate") != "") {
    	// 	$practicalShowFlightInfo.trigger("click");
    	// } else {
    	// 	$reserveShowFlightInfo.trigger("click");
    	// }
    	// if ($newState.attr("data-awbPrefix") != "" && $newState.attr("data-awbNo") != "" && $newState.attr("data-awbPostfix") != "") {
    	// 	$newState.trigger("click");
    	// }
   		// Session.deleteObject("orderManageOperation");
   	// }
});
define(['jquery', 'template', 'tooltip', 'dialog', 'session', 'store', 'plugins', 'json2', 'datepicker', 'datepicker_zh', 'jqueryQRCode', 'qrCode', 'JSEncrypt', 'homeI18n']
	, function ($, template, tooltip, Dialog, Session, Store, plugins, json2, datepicker, datepicker_zh, jqueryQRCode, qrCode, JSEncrypt, homeI18n) {
		//公共部分从原来的footer.js移入base.js
		$("body").find("select").attr("tabindex", -1);
		$("body").find("button").attr("tabindex", -1);
		$("body").find("input[type='checkbox']").attr("tabindex", -1);

		// 这里使用objec，才能动态修改值
		var B2B_BASE_URL = {
			value: ''
		}
		setHomeMenuData();

		/**渲染导航链接信息*/
		function setHomeMenuData() {
			var localHref = window.location.href;
			$("#homeUpMenu a").removeClass('active');
			var element = $("#homeUpMenu a").filter(function () {
				//处理当前a标签href
				var currentUrl = $(this).attr("href");
				if (null == currentUrl || "" == currentUrl || "#" == currentUrl) return false;
				currentUrl = currentUrl.substring(2);
				if (localHref.indexOf(currentUrl) != -1) {
					return true;
				}
			});

			if ((null == element || element.length == 0)
				&& (localHref.indexOf("pages/bookingList.do") != -1
					|| localHref.indexOf("pages/booking.do") != -1
					|| localHref.indexOf("pages/bookingDetail.do") != -1)) {
				element = $("#homeUpMenu a").eq(0);
			}

			element.addClass('active');
		}
		//如果.datePicker存在，则初始化日历控件
		if ($(".datePicker").length > 0) {
			$('.datePicker').datepicker({
				format: "yyyy-mm-dd",
				language: "zh-CN",
				orientation: "bottom left",
				autoclose: true
			});
		}
		var userId = Store.loadObject("userId")
		var userType = Store.loadObject("userType")
		if (userId == null || userType == "C" || userType == "G") {
			$(".agentAwbBrower").attr("href", "../pages/cargotrackingNew.do");
		}

		//校验是否为低版本IE浏览器
		function isIE() {
			var flag = false;
			if (navigator.userAgent.indexOf("MSIE") > 0) {
				if (navigator.userAgent.indexOf("MSIE 8.0") > 0) {
					flag = true;
				}
				if (navigator.userAgent.indexOf("MSIE 7.0") > 0) {
					flag = true;
				}
				if (navigator.userAgent.indexOf("MSIE 9.0") > 0 && !window.innerWidth) {
					flag = true;
				}
			}
			return flag;
		}

		var guideDownloadAppUrl = "https://apps.csair.com/"
		$('#header_qrcode').qrcode({ render: !isIE() ? "canvas" : "table", width: 108, height: 108, correctLevel: 0, text: guideDownloadAppUrl });
		// $(".showDownLoadAppBox").on("click", function () {
		// 	var $offset = $(this).offset(),
		// 		$top = $offset.top + 35,
		// 		$left = $offset.left - 100,
		// 		$hasClass = $(this).hasClass("isShowAppBox");
		// 	if ($hasClass) {
		// 		$("#mod-downloadApp").hide();
		// 		$(this).removeClass("isShowAppBox");
		// 	} else {
		// 		$(this).addClass("isShowAppBox");
		// 		$("#mod-downloadApp").css({ "left": $left, "top": $top }).show();
		// 	}
		// })
		// $(".showDownLoadAppBox").mouseleave(function () {
		// 	$("#mod-downloadApp").hide();
		// 	$(this).removeClass("isShowAppBox");
		// })
		// $("#iframe_download_app").remove();
		// // 创建iframe 下载app安装包
		// function createIframeToDownload(url){
		// 	var _iframe = '<iframe id="iframe_download_app" name="iframe_download_app" style="display:none" src='+ url +'></iframe>'; //创建iframe元素
		// 	$("body").append(_iframe);
		// }

		// $("#mod-downloadApp").on("click", ".iphone_btn", function () {
		// 	fun_downloadApp("ios")
		// })
		// $("#mod-downloadApp").on("click", ".android_btn", function () {
		// 	fun_downloadApp("android")
		// })
		// 显示loading层
		function showMLoading() {
			$("body").mLoading("show");
		}
		// 隐藏loading层
		function hideMLoading() {
			$('body').mLoading('hide');
		}

		//初始化页面.net超链接
		initNetHttpUrl();
		function initNetHttpUrl() {
			$.ajax({
				url: "../account/getNetHttpUrl.do",
				type: "POST",
				success: function (data) {
					if (data.success) {
						B2B_BASE_URL.value = data.returnObject
						var agentAwbBrowerUrl = data.returnObject + "/WebFace/Tang.WebFace.Cargo/AgentAwbBrower.aspx?menuID=1";//货物跟踪
						var activeFlightQueryCnUrl = data.returnObject + "/WebFace/Tang.WebFace.ActiveFlight/ActiveFlightQueryCN.aspx?menuID=1";//舱位查询
						var freightRateCnUrl = data.returnObject + "/WebFace/Tang.WebFace.RatePolicy/FreightRateCN.aspx";//运价查询
						var airlineNetworkBellyUrl = data.returnObject + "/WebFace/Tang.WebFace.Static/AirlineNetworkBelly.aspx?menuid=3";//航线网络

						// var publishIndexUrl = data.returnObject + "/Public/publish_index.aspx?menuID=4";// 应用下载
						var publishIndexUrl = ''
						var specialCharterUrl = data.returnObject + "/WebFace/Tang.WebFace.Static/specialCharter.aspx";//整机运输
						var domProductUrl = data.returnObject + "/WebFace/Tang.WebFace.Static/domProduct.aspx";//国内产品


						var newsMoreUrl = data.returnObject + "/WebFace/Tang.WebFace.News/NewsMore.aspx";//新闻动态

						var faqUrl = data.returnObject + "/Public/faq.aspx?menuID=1";//常见问题

						var airplaneTypeUrl = data.returnObject + "/WebFace/Tang.WebFace.Static/AirplaneType.aspx";//机型版型
						var userId = Store.loadObject("userId")
						var userType = Store.loadObject("userType")
						if (userId == null || userType == "C" || userType == "G") {
							$(".agentAwbBrower").attr("href", "../pages/cargotrackingNew.do");
						} else {
							$(".agentAwbBrower").attr("href", agentAwbBrowerUrl);
						}
						// 前端代码无法区分生产跟测试环境，通过接口参数来判断
						if(data.returnObject === 'https://cargodev.csair.com'){
							publishIndexUrl = 'https://cargodev.csair.com/publish_index/'
						}else{
							publishIndexUrl = 'https://tang.csair.com/Public/publish_index.aspx?menuID=4'
						}
						//$(".agentAwbBrower").attr("href", agentAwbBrowerUrl);
						$(".activeFlightQueryCn").attr("href", activeFlightQueryCnUrl);
						$(".freightRateCn").attr("href", freightRateCnUrl);
						// $(".airlineNetworkBelly").attr("href", airlineNetworkBellyUrl);
						$(".publishIndex").attr("href", publishIndexUrl);
						$(".specialCharter").attr("href", specialCharterUrl);
						$(".domProduct").attr("href", domProductUrl);
						$(".newsMore").attr("href", newsMoreUrl);
						//$(".faq").attr("href", faqUrl);
						// $(".airplaneType").attr("href", airplaneTypeUrl);
					} else {

					}

				}

			});
		}

		//通过类 .toUpperCase 绑定转换大写事件
		$("body").on("keyup", "input.toUpperCase", function () {
			if (this.value != this.value.toUpperCase())
				this.value = this.value.toUpperCase();
		});

		//通过类 .toUpperCase 绑定转换大写事件
		$("body").on("blur", "input.toUpperCase", function () {
			if (this.value != this.value.toUpperCase())
				this.value = this.value.toUpperCase();
		});

		//通过类 .volumeParameter,如果输入的长宽高不符合校验规则，则失去焦点的时候置空
		$("body").on("blur", ".volumeParameter", function () {
			var parent = $(this).parents("dd");
			var length = parent.find(".length").val();
			var width = parent.find(".width").val();
			var height = parent.find(".height").val();
			var piece = parent.find(".piece").val();
			var total = parent.find(".total");
			var thisVal = $(this).val();
			var pattern = new RegExp("^[1-9][0-9]{0,3}?$");
			var result = pattern.test(thisVal); // 正则表达式的结果;
			if (!result) {
				total.val("");
				$(this).val('');
				$(this).css("border-color", "red");
			} else {
				if ("" != length && "" != width && "" != height && "" != piece) {
					if (length > 110 || width > 90 || height > 76) {
						total.val("");
						$(this).val('');
						$(this).css("border-color", "red");
					}
					else {
						total.val(length * width * height * piece);
						$(this).css("border-color", "");
					}
				} else {
					if (length > 110 || width > 90 || height > 76) {
						$(this).val('');
						$(this).css("border-color", "red");
					}
					else {
						total.val(length * width * height * piece);
						$(this).css("border-color", "");
					}
				}
			}
		});

		//通过类 .volumePiece，如果输入的件数不符合校验规则，则失去焦点的时候置空
		$("body").on("blur", ".volumePiece", function () {
			var parent = $(this).parents("dd");
			var length = parent.find(".length").val();
			var width = parent.find(".width").val();
			var height = parent.find(".height").val();
			var piece = parent.find(".piece").val();
			var total = parent.find(".total");

			var thisVal = $(this).val();
			var pattern = new RegExp("^[1-9][0-9]{0,4}$");
			var result = pattern.test(thisVal); // 正则表达式的结果;
			if (!result) {
				total.val("");
				$(this).val('');
			} else {
				if (parseInt(thisVal) >= 32767) {
					total.val("");
					$(this).val('');
				} else {
					if ("" != length && "" != width && "" != height && "" != piece) {
						total.val(length * width * height * piece);
					}
				}
			}
		});

		//通过类 .volumeTotal，失去焦点的时候，重新校验长宽高件数，重新计算total
		$("body").on("blur", ".volumeTotal", function () {
			var parent = $(this).parents("dd");
			var length = parent.find(".length").val();
			var width = parent.find(".width").val();
			var height = parent.find(".height").val();
			var piece = parent.find(".piece").val();
			var total = parent.find(".total");

			var volumeParameter = new RegExp("^([1-9][0-9]{0,3}|0)([.][0-9]{1,2})?$");
			if (!volumeParameter.test(length)) {
				parent.find(".length").val("");
				$(this).val("");
				return;
			}

			if (!volumeParameter.test(width)) {
				parent.find(".width").val("");
				$(this).val("");
				return;
			}

			if (!volumeParameter.test(height)) {
				parent.find(".height").val("");
				$(this).val("");
				return;
			}

			var volumePiece = new RegExp("^[1-9][0-9]{0,4}$");
			if (!volumePiece.test(piece)) {
				parent.find(".piece").val();
				$(this).val("");
				return;
			}

			if (parseInt(piece) > 32768) {
				parent.find(".piece").val('');
				$(this).val("");
				return;
			}
			if ("" != length && "" != width && "" != height && "" != piece) {
				total.val(length * width * height * piece);
			}
		});

		//判断是否登录
		checkLogin();
		function checkLogin() {
			// 初始化语言,如果值为空则默认中文,base.js加载优先级最高
			if(!localStorage.getItem('BSA_LANGUAGE')){
				localStorage.setItem('BSA_LANGUAGE', 'ch');
			}
			var localHref = window.location.href;
			var returnIndex = localHref.indexOf("returnUrl");
			$.ajax({
				url: "../account/checkLogin.do",
				type: "POST",
				success: function (data) {
					if (data.success) {
						// 已经登陆过了
						if (data.returnObject) {
							$.ajax({
								url: "../account/getLoginUserInfo.do",
								contentType: "application/json",
								type: "POST",
								success: function (data) {
									var user = data.returnObject;
									Store.saveObject("userType", user.type);
									Store.saveObject("userName", user.userName);
									Store.saveObject("userId", user.userId);
									Store.saveObject("companyType", user.companyType);
									Store.saveObject("companyId", user.companyId);
									Store.saveObject("integrationMenu", user.integrationMenu);
									// 如果是b2c用户或者b2g用户则只显示原中文页面,type为G表示的b2c用户,如果userType为对象(b2g项目),value为1是b2b用户,2是b2g用户
									if(user.type === 'G' || user.type === 'C'){
										// 重新渲染数据
										homeI18n.setLanguage('ch')
										// 隐藏中英文切换按钮,默认show显示,hidden为隐藏
										$('html').attr('hiddenSwitchButton','hidden');
										//移除hidden让中文版的舱位预定等模块显示
										$('.contentShow').removeClass('hidden')
										//移除英文版hidden让中文版的导航栏菜单显示
										var bannerList = document.getElementById('bannerList');
										if(bannerList){
											bannerList.classList.remove('hidden');
										}
										var bannerListEn = document.getElementById('bannerListEn');
										if(bannerListEn){
											bannerListEn.classList.add('hidden');
										}
										//移除英文版头部和尾部让中文版的导航栏菜单显示
										document.getElementById('headCn').classList.remove('hidden');
										document.getElementById('headEn').classList.add('hidden');
										document.getElementById('footerCn').classList.remove('hidden');
										document.getElementById('footerEn').classList.add('hidden');
									}
									if (null != user.companyId) {
										Store.saveObject("companyName", user.companyName);
									}
									if (returnIndex > -1) {
										// 有returnUrl，直接跳转
										var returnUrl = localHref.substring(returnIndex + 10);
										// 校验returnUrl合法性
										$.ajax({
											url: "../account/checkReturnUrl.do",
											type: "POST",
											data: { "returnUrl": decodeURIComponent(returnUrl) },
											async: false,
											success: function (data) {
												if (data.success) {
													if (data.returnObject) {
														//检测到已登录跳转到对应界面
														window.location.replace(decodeURIComponent(returnUrl));
													} else {
														showDialog({
															title: "温馨提示", content: "请求来源不正确", closable: false,
															btnConfigs: [
																{
																	'btnText': '关闭窗口', 'btnEvent': function () {
																		window.location.replace("../pages/home.do");
																	}
																}
															]
														});
														return;
													}
												} else {
													showDialog({
														title: "温馨提示", content: "请求来源不正确", closable: false,
														btnConfigs: [
															{
																'btnText': '关闭窗口', 'btnEvent': function () {
																	window.location.replace("../pages/home.do");
																}
															}
														]
													});
													return;
												}
											}
										});

									} else {
										if (
											localHref.indexOf('/pages/signupPersonal.do') != -1 ||
											localHref.indexOf('/pages/signupEnterprise.do') != -1 ||
											localHref.indexOf('/passwdManage/toFindPwd.do') != -1
										) {
											//检测到已登录跳转首页
											window.location.replace('../pages/home.do')
										} else {
											$('#userName').text(user.userName)
											$('#userName').attr('title', user.userName)
											$('#userNameEn').text(user.userName)
											$('#userNameEn').attr('title', user.userName)
											showOnLine()
										}
									}
								}
							});

						} else {
							// 木有登陆
							showOffLine();
							/* 如果url里面包含returnUrl,那么就需要登录,弹出登陆框 */
							saveLocationHref();
							if (returnIndex > -1) {
								var returnUrl = localHref.substring(returnIndex + 10);
								showLoginBox(returnUrl);
							}
						}
					} else {
						// 木有登陆
						showOffLine();
						Store.deleteObject("userType");
						Store.deleteObject("userName");
						Store.deleteObject("userId");
						Store.deleteObject("companyName");
						Store.deleteObject("companyType");
						Store.deleteObject("companyId");
						Store.deleteObject("integrationMenu");
						/* 如果url里面包含returnUrl,那么就需要登录,弹出登陆框 */
						saveLocationHref();
						if (returnIndex > -1) {
							var returnUrl = localHref.substring(returnIndex + 10);
							showLoginBox(returnUrl);
						}
					}

					// 2022-06-22 郑岳春 触发自定义方法，播放“小博士谈安全”
					$('.video-container').trigger('play')
				}
			});
		};

		//保存登录前当前页面地址
		function saveLocationHref() {
			var localHref = window.location.href;
			var returnIndex = localHref.indexOf("returnUrl");

			if (returnIndex > -1) {
				window.sessionStorage.setItem("returnUrl", localHref.substring(returnIndex + 10));
			}
		}

		//离线模式，弹出登陆框；获取验证码，清空数据，删除userId,userName
		function showLoginBox(returnUrl) {
			var url = '';
			$.ajax({
				url: "../account/getCasUrl.do",
				type: "POST",
				//data:{"returnUrl":decodeURIComponent(returnUrl)},
				async: false,
				success: function (data) {
					if (data.success) {
						if (data.returnObject) {
							url = data.returnObject;
						} else {
							url = "https://cargo.csair.com/cas";
						}
					} else {
						//默认跳转到生产环境
						url = "https://cargo.csair.com/cas";
					}
					if (returnUrl) {
						window.location.href = url + "?service=" + returnUrl;
					} else {
						window.location.href = url;
					}
				}
			});

			//使用本地shiro登录的代码，shiro-context的real改回tangRealm即可
			//    	getLoginCodeBtn();//获取验证码
			//    	Store.deleteObject("userType");
			//    	Store.deleteObject("userName");
			//    	Store.deleteObject("userId");
			//    	Store.deleteObject("companyName");	
			//	    $("#login-user").val("");
			//        $("#login-psw").val("");
			//        $("#login-code").val(""); 
			//        $("#login-errmsg").html("");
			//        $("#loginBox").show();

		}

		//在线模式，用户名赋值
		function showOnLine() {
			$(".offLineBox").hide();
			$(".onLineBox").show();
			var integrationMenu = Store.loadObject("integrationMenu")
			if (integrationMenu && integrationMenu.whiteListFlag) {
				// 显示“物流服务”页头横向导航
				$("#cargoServices").show();
				// 显示“物流订单”菜单栏
				var cargoOrderMenuHtml = getCargoOrderMenuHtml()
				$('#cargoOrderMenu').append(cargoOrderMenuHtml);
				// 显示“物流联系人”
				$('.tab-nav__cargo').show()
			}
			if ("KJ" !== Store.loadObject("companyType")) {
				$("#order-management").show();
			}
		}
		//物流服务鼠标移入事件
		$('#cargoServices').on('mouseenter', function () {
			var integrationMenu = Store.loadObject("integrationMenu")
			var menuList = integrationMenu.menus
			var navListHtml = getCargoServicesListHtml(menuList)
			$('#cargoServicesList').append(navListHtml);
		}).on('mouseleave', function () {
			// 鼠标移开后清空
			$('#cargoServicesList').empty();
		});

		// 物流服务下拉子菜单渲染方法
		function getCargoServicesListHtml(list) {
			var html = ''
			if (list.length > 0) {
				html += ' <dl><dd>'
				for (var i = 0; i < list.length; i++) {
					html += '<a class="yi-ti-hua" role="button" data-href="' + list[i].menuUrl + '">' + list[i].menuName + '</a>'
				}
			}
			return html
		}

		// 获取物流订单菜单栏下拉菜单
		function getCargoOrderMenuHtml() {
			var html = '<a><i class="icon_order-manage cargo-order"></i>物流订单<span class="icon"></span></a><ul><li><a class="yitihua-cargoOrderView" href="#" data-href="/sites/inlandList">国内订单</a></li><li><a class="yitihua-cargoOrderView" href="#" data-href="/sites/internatList">国际订单</a></li></ul>'
			return html
		}

		//离线模式，用户名为空
		function showOffLine() {
			$("#userName").html("");
			$("#userNameEn").html("");
			$(".offLineBox").show();
			$(".onLineBox").hide();
			$("#cargoServices").hide();
			$("#cargoOrderMenu").empty();
			$(".tab-nav__cargo").hide();
			$("#order-management").hide();
		}
		//展示登录框
		$("#showLoginBoxBtn").click(function () {
			showLoginBox();
		});
		//退出登录
		function loginOut() {
			Store.deleteObject("userType");
			Store.deleteObject("userName");
			Store.deleteObject("userId");
			Store.deleteObject("companyName");
			Store.deleteObject("integrationMenu");
			Store.deleteObject("BSA_LANGUAGE");
			$.ajax({
				url: "../account/getCasLogoutUrl.do",
				type: "POST",
				async: false,
				success: function (data) {
					if (data.success) {
						if (data.returnObject) {
							window.location.href = data.returnObject;
						} else {
							window.location.href = "https://cargo.csair.com/cas/logout?service=https://cb2c.csair.com/logout";
						}
					} else {
						//默认跳转到生产环境
						window.location.href = "https://cargo.csair.com/cas/logout?service=https://cb2c.csair.com/logout";
					}
				}
			});
			//window.location.href="https://cargo.csair.com/cas/logout?service=https://cb2c.csair.com/logout";
		}

		//判断校验是否通过
		function checkContent(content, pattern) {
			return pattern.test(content);
		}

		//校验验证码，false校验未通过，true校验通过
		function verifyCaptcha() {
			var captcha = $("#login-code");
			var verifyCaptchaStatus = verifyOneField(captcha);
			if (!verifyCaptchaStatus) {
				captcha.val("");
				$("#login-errmsg").html("验证码不正确！");
				verifyFailed(captcha);
				return false;
			} else {
				$("#login-errmsg").html("");
				verifyClear(captcha);
				return true;
			}
		}

		//登出
		$(".loginOutBtn").click(function () {
			loginOut();
		});

		//个人中心侧边栏渲染
		function setPersonSideMenu() {
			var userType = Store.loadObject("userType");
			var companyType = Store.loadObject("companyType");
			var menu = '<div class="center-nav" id="center-nav">'
				+ '<dl>'
				// +'<dt><span class="icon-center"></span>个人中心</dt>'
				+ '<dd class="collapse">'
				+ '<a><i class="icon_user-manage"></i>账户管理<span class="icon"></span></a>'
				+ '<ul>'
				+ '<li><a href="../pages/personalInfo.do">基础信息</a></li>'
			if ("C" != userType) {
				menu += '<li><a href="../company/enterpriseInfo.do">企业信息</a></li>';
			}
			menu += '<li><a href="../pages/frequentContacts.do">常用联系人</a></li>'
				+ '<li><a href="../pages/employeeNumManage.do">公务认证</a></li>'
				+ '</ul>'
				+ '</dd>'
			if ("KJ" != companyType) {
				menu += '<dd><a href="../pages/orderManage.do"><i class="icon_order-manage"></i>航空订单</a></dd>';
			}
			// 物流订单菜单栏
			menu += '<dd id="cargoOrderMenu" class="collapse">'
				+ '</dd>'
			/*+'<dd><a href="../pages/changeManage.do">变更管理</a></dd>'*/
			menu += '<dd class="collapse">'
				+ '<a><i class="icon_purse"></i>货运钱包<span class="icon"></span></a>'
				+ '<ul>'
				+ '<li><a href="../pages/advanceManageImprest.do">在线充值</a></li>'
				+ '<li><a href="../pages/useDetail.do">使用明细</a></li>'
				+ '<li><a href="../pages/alarmSet.do">告警设置</a></li>'
				+ '</ul>'
				+ '</dd>'
				// +'<dd><a href="../pages/expressManage.do">快件单管理</a></dd>'
				+ '<dd><a href="../pages/dailyStatement.do"><i class="icon_paper"></i>销售日报</a></dd>'
				+ '<dd><a href="../pages/oversizedGoods.do"><i class="icon_over"></i>超规货申报</a></dd>'
				+ '<dd><a href="../pages/dangerAccountManagement.do"><i class="icon_danger_account_management"></i>危险品账号</a></dd>'
				+ '<dd class="collapse">'
				+ '<a><i class="icon_purse"></i>易捷赔<span class="icon"></span></a>'
				+ '<ul>'
				+ '<li><a href="../pages/timelyCompensation.do">时效赔付</a></li>'
				+ '<li><a href="../pages/claimsManagement.do">赔付管理</a></li>'
				+ '<li><a href="../pages/cargoDamageClaim.do" data-lang-key="cargoDamageClaim" class="claim-en">货损索赔</a></li>'
				+ '<li><a href="../pages/cargoDamageClaimManagement.do" data-lang-key="claimsManagement" class="claim-en">索赔管理</a></li>'
				+ '</ul>'
				+ '</dd>'
			menu += '</dl>'
				+ '</div>';
			$("#sideMenu").html("");
			$("#sideMenu").html(menu);

			var localHref = window.location.href;
			var element = $("#sideMenu a").filter(function () {
				var url = $(this).attr("href");
				if ("" == url || null == url || "#" == url) return false;
				url = url.substring(2);
				if (localHref.indexOf(url) != -1) {
					Session.deleteObject("sidebarMenuUrl");
					Session.saveObject("sidebarMenuUrl", url);
					return true;

				} else if (url == "/pages/frequentContacts.do" &&
					(localHref.indexOf("/pages/editFrequentContacts.do") != -1
						|| localHref.indexOf("/pages/addFrequentContacts.do") != -1)) {
					return true;

				} else if (url == "/company/enterpriseInfo.do" &&
					localHref.indexOf("/company/addEnterpriseAccount.do") != -1) {
					return true;

				} else if (url == "/pages/advanceManageImprest.do" &&
					localHref.indexOf("/pages/rechargeImprest.do") != -1) {
					return true;
				} else if (url == "/pages/oversizedGoods.do" &&
					localHref.indexOf("/pages/amodifyoversizedGoods.do") != -1) {
					return true;
				} else if (url == "/pages/dangerAccountManagement.do" &&
					localHref.indexOf("/pages/dangerAccountManagement.do") != -1) {
					return true;
				}
			});

			//快件单详情、货物跟踪页面，快件单管理按钮active
			if (localHref.indexOf('expressWaybill') != -1) {
				$("#sideMenu a[href='../pages/expressManage.do']").parent().addClass("active");
				$("#sideMenu a[href='../pages/expressManage.do']").parents('dd').addClass("active");
			} else {
				$("#sideMenu a[href='../pages/expressManage.do']").parent().removeClass("active");
				$("#sideMenu a[href='../pages/expressManage.do']").parents('dd').removeClass("active");
			}

			if (element.length > 0) {
				$(element).parent().addClass("active");
				$(element).parents("dd").addClass("active");
			}

			$("#center-nav dd.collapse").on("click", function () {
				if ($(this).hasClass("active")) {
					$(this).find("ul").slideUp("normal", function () {
						$(this).parent().removeClass("active");
					});
				} else {
					$(this).addClass("active").find("ul").slideDown("normal");
				}
				$(this).siblings("dd.collapse").removeClass("active").find("ul").slideUp("normal");
			});
		}

		// 物流订单菜单栏跳转到一体化的订单页面
		$(document).delegate('.yitihua-cargoOrderView', 'click', function () {
			var backUrl = $(this).attr('data-href')
			openYiTiHuaUrl(backUrl)

		})

		// 关闭模态框
		$(document).delegate('[data-dismiss="modal"]', "click", function () {
			var myModal = $(this).parents(".modal");
			myModal.removeClass("in");
			setTimeout(function () {
				myModal.hide().find(".modal-backdrop").removeClass("in");
			}, 100);
		});

		/**
		 * 调用提示框的FUN
		 * @function hintFun
		 * @param {object}   target         为调用提示框的对象
		 * @param {number}   boxWidth       为调用提示框的宽度
		 * @param {string}   orientation    为调用提示框的方向，"left"在左边,"right"在右边,"center"居中
		 * @param {string}   uitype         为调用提示框的颜色，"primary"为蓝色，"danger"为红色
		 * @param {string}   visibility     为调用提示框的显示，"show"为显示，"hide"为隐藏
		 * @param {string}   dynamic        为调用提示框的动态，"dynamic"为每次显示都重新读取新的数据
		 * @param {function} fun            为处理ajax的函数
		 * */
		function hintFun(param) {
			var target, boxWidth, orientation, uitype, visibility, dynamic, fun, hintBox, template, hintTitle, hintId, dataId, position, height, newTop;
			// bodyHeight为页面body元素的高度，hintBoxHeight为提示枢的高度
			var bodyHeight = $("body").height(), hintBoxHeight = null;
			target = param.target || null;
			boxWidth = param.boxWidth || null;
			orientation = param.orientation || null;
			uitype = param.uitype || "primary";
			visibility = param.visibility || null;
			dynamic = param.dynamic || null;
			fun = param.fun || null;
			hintBox = null;
			template = null;
			hintTitle = target.attr("hintTitle");
			hintId = target.attr("hintId");
			dataId = target.attr("dataId");
			position = target.offset();
			height = target.height() + 6;
			newTop = parseInt(position.top) + height;

			if (hintId) {
				hintBox = $("#" + hintId);
				if (dynamic) {
					if (hintTitle) hintBox.find(".hint-box-content").html(hintTitle);
					if (fun) hintBox.find(".hint-box-content").html(fun());
				}
				if (visibility == "hide" || visibility == null) {
					//hintBox.hide();
					hintBox.remove();
					target.removeAttr("hintid");
				} else if (visibility == "show") {
					// 重新计算提示框的显示方向
					hintBoxHeight = hintBox.height();
					if ((parseInt(position.top) + hintBoxHeight) >= bodyHeight) {
						newTop = parseInt(position.top) - hintBoxHeight - 6;
					}
					hintBox.css("top", newTop).show();
				}
			} else {
				hintId = "hint" + new Date().getTime();
				if (hintTitle) {
					addHintBoxFun(target, hintId, hintTitle, uitype, boxWidth, orientation);
				} else {
					if (fun) {
						// ajax
						template = fun(dataId);
					}
					addHintBoxFun(target, hintId, template, uitype, boxWidth, orientation);
				}
			}
		}

		/**
		 * 向Document添加新的提示框
		 * @function addHintBoxFun        生成新的提示框并添加到文档
		 * @param {object} target         hintFun传来的目标对象
		 * @param {string} hintId         hintFun传来的提示框ID
		 * @param {string} content        hintFun传来的内容
		 * @param {string} uitype         hintFun传来的窗口类型
		 * @param {number} boxWidth       hintFun传来的宽度
		 * @param {string} orientation    hintFun传来的方向
		 * */
		function addHintBoxFun(target, hintId, content, uitype, boxWidth, orientation) {
			var html = "",
				newBoxWidth = null,
				newOrientation = null,
				body = $("body"),
				bodyHeight = body.height(),
				hintBoxHeight = null,
				hintBoxTop = null,
				hintBoxLeft = null,
				position = target.offset(),
				width = target.innerWidth(),
				height = target.innerHeight() + 6;
			switch (orientation) {
				case "left":
					newBoxWidth = 20;
					newOrientation = 'margin-left: ' + (16 + width / 2) + 'px;';
					break;
				case "right":
					newBoxWidth = boxWidth - width - 20;
					newOrientation = 'margin-left: ' + (boxWidth - width / 2 - 20) + 'px;';
					break;
				default:
					newBoxWidth = boxWidth / 2 - width / 2;
					newOrientation = 'margin-left: ' + (boxWidth / 2 - 5) + 'px;';
			}
			hintBoxTop = parseInt(position.top) + height;
			hintBoxLeft = parseInt(position.left) - newBoxWidth;
			html += '<div class="hint-box ' + uitype + '" id="' + hintId + '" style="display:block;width:' + boxWidth + 'px;top:' + hintBoxTop + 'px;left:' + hintBoxLeft + 'px;">';
			html += '<div class="hint-box-triangle" style="' + newOrientation + '"></div><div class="hint-box-content">' + content + '</div></div>';
			target.attr("hintId", hintId);
			body.append(html);

			// 重新计算提示框的显示方向
			hintBoxHeight = $("#" + hintId).height();
			if ((parseInt(position.top) + hintBoxHeight) >= bodyHeight) {
				hintBoxTop = parseInt(position.top) - hintBoxHeight;
				$("#" + hintId).css({ "top": hintBoxTop }).find(".hint-box-triangle").addClass("reverse");
			}
		}

		/**
		 * 调用模态框
		 * @function myModalFun           生成新的提示框并添加到文档
		 * @param {object} target         目标对象
		 * @param {string} operate        对目标进行的操作
		 * */
		function myModalFun(target, operate) {
			if (operate == "show") {
				target.show(100).addClass("in").find(".modal-backdrop").addClass("in");
			} else {
				target.removeClass("in");
				setTimeout(function () {
					target.hide().find(".modal-backdrop").removeClass("in");
				}, 100);
			}
		}

		// 调用提示工具（Tooltip）
		initTooltip();
		// 绑定 show.bs.tooltip 事件，如果当前输入项输入正确，即不调用提示工具
		$(document).on('show.bs.tooltip', "input[data-toggle='tooltip']", function () {
			if ($(this).hasClass("success")) return false;
		});
		function initTooltip() {
			$("input[data-toggle='tooltip']").tooltip({ 'trigger': 'focus', 'placement': 'top', delay: { show: 100 } });
		}
		// 获取字符串长度，双字节算2个字符长度
		function getStrLength(val) {
			var newVal = val.replace(/[^\x00-\xff]/g, 'aa')
			return newVal.length
		}

		//input验证，通过在输入项上添加属性 data-pattern="正则表达式" 来绑定，并通过属性 data-required="required" 确定是否为必填项;
		function verifyOneField(field) {
			var thisVal = field.val(),// 输入项的值;
				required = field.attr("data-required"), // 是否为必填项;
				pattern = new RegExp(field.attr("data-pattern")), // 正则表达式对象;
				result = pattern.test(thisVal); // 正则表达式的结果;
			if (thisVal != "") { // 输入项的值不为空时;
				// 校验不超过最长长度 一个汉字算2个字符
				var maxlength = field.attr("data-maxlength");
				if (maxlength) {
					var computeLenOfChinese = field.attr("data-computeLenOfChinese");
					var valLength = computeLenOfChinese ? getStrLength(thisVal) : thisVal.length;
					if (valLength > maxlength) {
						verifyFailed(field); return false;
					}
				}
				if (result) {
					// 正则表达式的结果为true时;
					verifySucceed(field); return true;
				} else {
					// 正则表达式的结果为false时;
					verifyFailed(field); return false;
				}
			} else { // 输入项值为空时
				if (required == "true" || required == "required") {
					// 当为必填项时,增加错误提示样式.has-error;
					verifyFailed(field); return false;
				} else {
					// 当为选填项时，移除错误提示样式.has-error;
					verifySucceed(field); return true;
				}
			}
		}
		// form校验，form为表单的jquery对象
		function verifyForm(form) {
			var patternArray = $(form).find("input").not(":hidden"), errNum = 0;
			patternArray.each(function () {
				var target = $(this);
				if (!verifyOneField(target)) errNum++;
			});
			if (errNum > 0) return false;
			return true;
		}
		//验证成功
		function verifySucceed(field) {
			verifyClear(field);
			field.addClass("success").parent().parent().removeClass("has-error");
		}
		//验证失败
		function verifyFailed(field) {
			verifyClear(field);
			field.removeClass("success").parent().parent().addClass("has-error");
		}
		//清除校验样式
		function verifyClear(field) {
			field.removeClass("success").parent().parent().removeClass("has-error");
		}
		//校验航班号
		function verifyFlightNo(content) {
			if ("" == content) return true;
			var isNum = content.replace(/[^0-9]/ig, "");
			//至少包含一个数字
			if ("" == isNum) return false;
			//3-7数字或者字母
			var pattern = new RegExp("^[A-Za-z0-9]{3,7}$");
			var result = pattern.test(content);
			return result;
		}
		//封装对话框
		function showDialog(config) {
			Dialog.open(config);
		}
		var textMap = {
			en:{
				loading:'Loading...'
			},
			ch:{
				loading:'加载中...'
			}
		}
		//封装请求方法
		function ajaxRequest(obj) {
			var currentLang = $('html').attr('lang') || 'ch'
			//设置请求超时时间,默认为：30 * 10000
			var timeout = 30 * 10000;
			if (obj.timeout) { timeout = obj.timeout; }
			//设置请求方式，默认为POST
			var type = "POST";
			if (obj.type) { type = obj.type; }
			//设置信息至服务器时内容编码类型，默认为application/json
			var contentType = "application/json";
			if (obj.contentType || obj.contentType === false) { contentType = obj.contentType; }
			var processData = true;
			if (obj.processData === false) { processData = obj.processData; }
			//设置请求参数 
			var data = obj.param;
			if (contentType == "application/json") { data = JSON.stringify(obj.param); }
			//设置是否异步，默认为true，异步请求
			var async = true;
			if (obj.async === false) { async = false; }
			//设置是否在url后加timestamp
			var url = ''
			if (obj.url.indexOf('?') === -1) {
				url = obj.url + "?timestamp=" + new Date().getTime();
			} else {
				url = obj.url + "&timestamp=" + new Date().getTime();
			}
			//BSA中英文切换
			var bsaLanguage = localStorage.getItem("BSA_LANGUAGE");
			var Lang = bsaLanguage && bsaLanguage == "en" ? "en_US" : "";
			var headers =  { 'Lang': Lang }
			if (obj.headers && typeof obj.headers === 'object') {
				Object.assign(headers, obj.headers);
			}
			if (obj.timestamp === false) { url = obj.url; }
			var options = {
				contentType: contentType,
				processData: processData,
				dataType: "json",
				traditional: true,
				cache: false,
				timeout: timeout,
				type: type,
				url: url,
				data: data,
				async: async,
				headers: headers,
				beforeSend: function () {
					//如果needLoader为false，不需要loading框;
					if (obj.needLoader == true) { $("body").mLoading({text:textMap[currentLang]['loading']})}
				},
				/* complete:function(){
					if(obj.needLoader==true){
						$('body').mLoading('hide');
						//setTimeout("$('body').mLoading('hide')",500);
					}
				}, */
				success: function (data, textStatus, jqXHR) {
					// 如果同时调多个接口并使用loading，防止重复调用loading，第一个请求需要传unhidden为true
					if (obj.needLoader == true && !obj.unhidden) {
						$('body').mLoading('hide');
					}
					//如果needDeal为true,直接交给业务逻辑去处理
					if (obj.needDeal == true) {
						if (data.success) {
							obj.success(data, textStatus, jqXHR);
						} else {
							if (null != data.exceptionStack) {
								showDialog({ content: "系统异常，请稍后重试" });
							} else if (data.exceptionMessage.indexOf("账号或密码不正确") != -1) {
								obj.success(data, textStatus, jqXHR);
							} else if (data.exceptionMessage.indexOf("重新登录") != -1) {
								window.location.href = "../pages/home.do?returnUrl="
									+ encodeURIComponent(window.location.href);
							} else {
								obj.success(data, textStatus, jqXHR);
							}
						}
					} else {
						if (data.success) {
							// 如果为isValidate为true，则自己处理
							if (obj.isValidate) {
								obj.success(data, textStatus, jqXHR);
							} else {
								obj.success(data.returnObject, textStatus, jqXHR);
							}
						} else {
							if (null != data.exceptionStack) {
								showDialog({ content: "系统异常，请稍后重试" });
							} else if (data.exceptionMessage.indexOf("重新登录") != -1) {
								window.location.href = "../pages/home.do?returnUrl="
									+ encodeURIComponent(window.location.href);
							} else {
								showDialog({ content: data.exceptionMessage });
							}
						}
					}
				},
				error: function (e, xhr, type) {
					// 关闭loading
					if (obj.needLoader == true) {
						$('body').mLoading('hide');
					}
					if (obj.error) {
						obj.error(e, xhr, type);
					} else {
						showDialog({ content: "网络异常，请稍后重试" });
					}
				}
			};
			$.ajax(options);
		};
		//封装接收参数函数
		function getRequestParam() {
			var url = location.search;
			var requestParam = new Object();
			if (url.indexOf("?") != -1) {
				var str = url.substr(1);
				strs = str.split("&");
				for (var i = 0; i < strs.length; i++) {
					requestParam[strs[i].split("=")[0]] = decodeURIComponent(strs[i].split("=")[1]);
				}
			}
			return requestParam;
		}

		function getShipmentTypeString(data) {
			return encodeURIComponent(JSON.stringify(data))
		}
		function getShipmentTypeData(str) {
			return JSON.parse(decodeURIComponent(str))
		}

		// 字符逆转义
		function htmlDecodeByRegExp(str) {
			var s = ''
			if (!str || typeof str !== 'string') { return '' }
			s = str.replace(/&amp;/g, '&')
			s = s.replace(/&lt;/g, '<')
			s = s.replace(/&gt;/g, '>')
			s = s.replace(/&nbsp;/g, ' ')
			s = s.replace(/&quot;/g, '"')
			s = s.replace(/&ldquo;/g, '“')
			s = s.replace(/&rdquo;/g, '”')
			s = s.replace(/&mdash;/g, '—')
			return s
		}

		// 创建随机ID
		function getUUID() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				return (c === 'x' ? (Math.random() * 16) | 0 : 'r&0x3' | '0x8').toString(16)
			})
		}

		function passwordEncrypt(val) {
			var passwordPublicKey =
				"MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCgnqBwW/X2NKRNEXe+H0pT8QAYGpzV53VFc8aHgvTg7UZl+WuFA5X7xNBzEvXaiwBcf9hJOAZvEeuy7M6bvlL2DTpU594YKxYofhsvL6irOm8yLFSf2o+dDIbYiZtTV0yvwjZKQAyqZeFhsHFZeJpQDggEJqYjjwccsnNxrJM9XwIDAQAB";
			var encrypt = new JSEncrypt();
			encrypt.setPublicKey(passwordPublicKey);
			return encrypt.encrypt(val);
		}

		// 计算日期差距
		function compareDate(start, end) {
			if (!start || !end) { return 0 }
			start = start.replace(/-/g, "/");
			end = end.replace(/-/g, "/");
			var startTime = new Date(start).getTime();
			var endTime = new Date(end).getTime();
			var iDays = parseInt((endTime - startTime) / 1000 / 60 / 60 / 24);
			return iDays;
		}

		/**
   * @description: 跳转一体化地址+登录
   * @param {*} backUrl 转跳地址
   * @param {*} isBlank 是否打开新标签页
   * @return {*}
   */
		function openYiTiHuaUrl(targetUrl, isBlank) {
			var blank = isBlank === false ? false : true
			ajaxRequest({
				url: '../account/getYitihuaHttpUrl.do',
				type: 'POST',
				needLoader: true,
				success: function (returnObj, textStatus, jqXHR) {
					var baseUrl = returnObj.yitihuaHttpUrl
					var ticket = returnObj.ticket
					var url = returnObj.yitihuaHttpUrl

					// 必须登录后才能跳转，则跳转到登录界面
					if (!ticket) {
						return showDialog({
							title: "温馨提示", content: "当前用户登录超时，请重新登录!", closable: false,
							btnConfigs: [
								{
									'btnText': '确定', 'btnEvent': function () {
										window.location.href = "https://cargodev.csair.com/cas/login";
									}
								}
							]
						});
					}
					url = baseUrl + '/cargoLogin/authorize/automaticLogin' + '?ticket=' + ticket + '&backUrl=' + targetUrl
					if (blank) {
						window.open(url, '_blank')
					} else {
						location.href = url
					}
				},
			})
		}

		// 删除数组重复元素
		function norepeat(arr) {
			for (let i = 0; i < arr.length; i++) {
				if (arr.indexOf(arr[i]) != i) { //如果arr[i]的下标 与 i不相等说明 arr[i]与arr[i-1]相同 代表arr[i]与arr[i-1]重复出现
					arr.splice(i, 1);//删除数组第i个元素
					i--;//数组下标回退
				}
			}
			return arr;
		}

		// 获取字符串的字符长度
		function getByteLength(str) {
			let len = 0;
			for (let i = 0; i < str.length; i++) {
				let c = str.charAt(i);
				if (/^[\u0000-\u00ff]$/.test(c)) {
					len++;
				} else {
					len += 2;
				}
			}
			return len;
		}

		var fileTypeMap = {
		  txt: 'data:text/plain;base64,',
		  doc: 'data:application/msword;base64,',
		  docx: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,',
		  xls: 'data:application/vnd.ms-excel;base64,',
		  xlsx: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,',
		  pdf: 'data:application/pdf;base64,',
		  ppt: 'data:application/vnd.ms-powerpoint;base64,',
		  pptx: 'data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,',
		  png: 'data:image/png;base64,',
		  jpg: 'data:image/jpeg;base64,',
		  jpeg: 'data:image/jpeg;base64,',
		  gif: 'data:image/gif;base64,',
		  svg: 'data:image/svg+xml;base64,',
		  ico: 'data:image/x-icon;base64,',
		  bmp: 'data:image/bmp;base64,'
		};
		function getBase64Type(type) {
			if(!type){
				throw Error('缺少Type参数')
			}
			var lowerType = type.toLowerCase()
			return fileTypeMap[lowerType];
		  }
		function base6toBlob(dataurl) {
			var arr = dataurl.split(",")
			var mimeString = arr[0].match(/:(.*?);/)[1]
			var str = atob(arr[1])
			var u8 = new Uint8Array(str.length)
			for (var i = 0; i < str.length; i++) {
				u8[i] = str.charCodeAt(i)
			}
			return new Blob([u8], { type: mimeString })
		}
		/**
		 * @description: 下载文件
		 * @param {*} base64Url base64格式的数据
		 * @param {*} fileName 文件名
		 * @param {*} type 文件类型
		 */
		function downloadFileFn(base64Url, fileName, type) {
			var base64 = getBase64Type(type) + base64Url
			var myBlob = base6toBlob(base64)
			var myUrl = URL.createObjectURL(myBlob)
			var link = document.createElement('a')
			link.style.display = 'none'
			link.href = myUrl
			link.setAttribute('download', fileName)
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			window.URL.revokeObjectURL(myUrl)
		}
		return {
			hintFun: hintFun,
			addHintBoxFun: addHintBoxFun,
			myModalFun: myModalFun, //调用模态框
			initTooltip: initTooltip, // 调用提示工具（Tooltip）
			verifyOneField: verifyOneField, //input验证
			verifyForm: verifyForm, //form校验
			verifySucceed: verifySucceed, //验证成功
			verifyFailed: verifyFailed, //验证失败
			verifyClear: verifyClear, //清除校验样式
			showDialog: showDialog, //封装对话框
			verifyFlightNo: verifyFlightNo,
			ajaxRequest: ajaxRequest, //封装请求方法
			getRequestParam: getRequestParam, //封装接收参数函数
			setPersonSideMenu: setPersonSideMenu, //设置个人中心侧边栏
			showLoginBox: showLoginBox, //展示登陆框
			showOnLine: showOnLine,
			showOffLine: showOffLine,
			showMLoading: showMLoading,
			hideMLoading: hideMLoading,
			getShipmentTypeString: getShipmentTypeString,
			getShipmentTypeData: getShipmentTypeData,
			htmlDecodeByRegExp: htmlDecodeByRegExp, //字符逆转义
			getUUID: getUUID, // 获取uuid（随机字符串）
			loginOut: loginOut, // 退出登录
			B2B_BASE_URL: B2B_BASE_URL,
			getStrLength: getStrLength, // 计算字符串长度
			passwordEncrypt: passwordEncrypt,
			norepeat: norepeat,
			getByteLength: getByteLength,
			compareDate: compareDate, // 计算日期差距
			openYiTiHuaUrl: openYiTiHuaUrl, // 一体化跳转
			downloadFileFn: downloadFileFn // 下载文件
		}

	});


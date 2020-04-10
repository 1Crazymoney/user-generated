ninja.wallets.paperwallet = {
	isOpen: function () {
		return (document.getElementById("usergenbcn-paperwallet").className.indexOf("selected") != -1);
	},

	open: function () {
		document.getElementById("usergenbcn-main").setAttribute("class", "paper"); // add 'paper' class to main div
		var paperArea = document.getElementById("usergenbcn-paperarea");
		paperArea.style.display = "block";
		var perPageLimitElement = 1;
		var limitElement = document.getElementById("usergenbcn-paperlimit");
		var pageBreakAt = (ninja.wallets.paperwallet.useArtisticWallet) ? ninja.wallets.paperwallet.pageBreakAtArtisticDefault : ninja.wallets.paperwallet.pageBreakAtDefault;
		if (perPageLimitElement && perPageLimitElement.value < 1) {
			perPageLimitElement.value = pageBreakAt;
		}
		if (limitElement && limitElement.value < 1) {
			limitElement.value = pageBreakAt;
		}
		if (document.getElementById("usergenbcn-paperkeyarea").innerHTML == "") {
			ninja.wallets.paperwallet.encrypt = false;
			ninja.wallets.paperwallet.build(limitElement.value, pageBreakAt, true, '');
		}
	},

	close: function () {
		document.getElementById("usergenbcn-paperarea").style.display = "none";
		document.getElementById("usergenbcn-main").setAttribute("class", ""); // remove 'paper' class from main div
	},

	remaining: null, // use to keep track of how many addresses are left to process when building the paper wallet
	count: 0,
	pageBreakAtDefault: 7,
	pageBreakAtArtisticDefault: 1,
	useArtisticWallet: true,
	pageBreakAt: null,
	BCHAddresses: [],
	currentMilli: 1,

	build: function (numWallets, pageBreakAt, useArtisticWallet, passphrase) {
		if (numWallets < 1) numWallets = 1;
		if (pageBreakAt < 1) pageBreakAt = 1;
		ninja.wallets.paperwallet.remaining = numWallets;
		ninja.wallets.paperwallet.count = 0;
		ninja.wallets.paperwallet.useArtisticWallet = useArtisticWallet;
		ninja.wallets.paperwallet.pageBreakAt = pageBreakAt;
		document.getElementById("usergenbcn-paperkeyarea").innerHTML = "";
		if (ninja.wallets.paperwallet.encrypt) {
			if (passphrase == "") {
				alert(ninja.translator.get("bip38alertpassphraserequired"));
				return;
			}
			document.getElementById("usergenbcn-busyblock").className = "busy";
			ninja.privateKey.BIP38GenerateIntermediatePointAsync(passphrase, null, null, function (intermediate) {
				ninja.wallets.paperwallet.intermediatePoint = intermediate;
				document.getElementById("usergenbcn-busyblock").className = "";
				setTimeout(ninja.wallets.paperwallet.batch, 0);
			});
		}
		else {
			setTimeout(ninja.wallets.paperwallet.batch, 0);
		}
	},

	batch: function () {
		if (ninja.wallets.paperwallet.remaining > 0) {
			var paperArea = document.getElementById("usergenbcn-paperkeyarea");
			var template = 'default';
			ninja.wallets.paperwallet.count++;
			var i = ninja.wallets.paperwallet.count;
			var pageBreakAt = ninja.wallets.paperwallet.pageBreakAt;
			var div = document.createElement("div");
			div.setAttribute("id", "usergenbcn-keyarea" + i);
			div.innerHTML = ninja.wallets.paperwallet.templateArtisticHtml(i, template);
			div.setAttribute("class", "keyarea art");

			if (paperArea.innerHTML != "") {
				// page break
				if ((i - 1) % pageBreakAt == 0 && i >= pageBreakAt) {
					var pBreak = document.createElement("div");
					pBreak.style.pageBreakBefore = "always";
					pBreak.setAttribute("class", "pagebreak");
					document.getElementById("usergenbcn-paperkeyarea").appendChild(pBreak);
					if (!ninja.wallets.paperwallet.useArtisticWallet) {
						div.style.borderTop = "2px solid green";
					}
				}
			}
			document.getElementById("usergenbcn-paperkeyarea").appendChild(div);
			ninja.wallets.paperwallet.resetOptions();
			ninja.wallets.paperwallet.generateNewWallet(i);
			ninja.wallets.paperwallet.remaining--;
			setTimeout(ninja.wallets.paperwallet.batch, 0);
		}
	},

	// generate bitcoin address, private key, QR Code and update information in the HTML
	// idPostFix: 1, 2, 3, etc.
	generateNewWallet: function (idPostFix) {
		if (ninja.wallets.paperwallet.encrypt) {
			var compressed = true;
			ninja.privateKey.BIP38GenerateECAddressAsync(ninja.wallets.paperwallet.intermediatePoint, compressed, function (address, encryptedKey) {
				Bitcoin.KeyPool.push(new Bitcoin.Bip38Key(address, encryptedKey));
				if (ninja.wallets.paperwallet.useArtisticWallet) {
					ninja.wallets.paperwallet.showArtisticWallet(idPostFix, bchaddr.toCashAddress(address), encryptedKey);
				}
				else {
					ninja.wallets.paperwallet.showWallet(idPostFix, bchaddr.toCashAddress(address), encryptedKey);
				}
			});
		}
		else {
			var key = new Bitcoin.ECKey(false);
			// key.setCompressed(true);
			var bitcoinAddress = key.getBitcoinAddress();
			var bitcoinBCHAddress = bchaddr.toCashAddress(bitcoinAddress);
			var privateKeyWif = key.getBitcoinWalletImportFormat();
			ninja.wallets.paperwallet.BCHAddresses.push(bitcoinBCHAddress);
			if (ninja.wallets.paperwallet.useArtisticWallet) {
				ninja.wallets.paperwallet.showArtisticWallet(idPostFix, bitcoinBCHAddress, privateKeyWif);
			}
			else {
				ninja.wallets.paperwallet.showWallet(idPostFix, bitcoinBCHAddress, privateKeyWif);
			}
		}
	},

	downloadAddressesCsv: function () {
		document.getElementById("usergenbcn-publicaddresses").disabled = true;
		setTimeout(function(){document.getElementById("usergenbcn-publicaddresses").disabled = false;},5000);
		var BCHAmount = ninja.wallets.paperwallet.currentMilli / 1000;
		var text = ninja.wallets.paperwallet.BCHAddresses.map(function (element) {
			return element + "," + BCHAmount;
		}).join("\n");

		var now = new Date();
		var filename = 'PublicAddresses-' + now.getFullYear() + (now.getMonth() + 1).toString() + now.getDate() + '-' + now.getHours() + now.getMinutes() + now.getSeconds() + ".csv";

		if (text) {
			var element = document.createElement('a');
			element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
			element.setAttribute('download', filename);
			element.style.display = 'none';
			document.body.appendChild(element);
			element.click();
			document.body.removeChild(element);
		}
	},

	showWallet: function (idPostFix, bitcoinAddress, privateKey) {
		document.getElementById("usergenbcn-btcaddress" + idPostFix).innerHTML = bitcoinAddress;
		document.getElementById("usergenbcn-btcprivwif" + idPostFix).innerHTML = privateKey;
		var keyValuePair = {};
		keyValuePair["usergenbcn-qrcode_public" + idPostFix] = bitcoinAddress;
		keyValuePair["usergenbcn-qrcode_private" + idPostFix] = privateKey;
		ninja.qrCode.showQrCode(keyValuePair);
		document.getElementById("usergenbcn-keyarea" + idPostFix).style.display = "block";
	},

	templateArtisticHtml: function (i, template) {
		var image = ninja.images.paperwalletimages()['default']['standard'];

		var walletHtml =
			"<div class='artwallet' id='usergenbcn-artwallet" + i + "'>" +
			"<img id='usergenbcn-papersvg" + i + "' class='papersvg' src='" + image + "' />" +
			
			// Front Elements
			"<div id='usergenbcn-qrcode_public" + i + "' class='qrcode_public'></div>" +
			"<div id='usergenbcn-qrcode_private-" + i + "' class='qrcode_private'></div>" +
			"<div class='copyright' id='usergenbcn-copyright-" + i + "'><span class='copy-symbol'>©</span> Global Notes Pty Ltd</div>" +
			"<div class='btcaddress first' id='usergenbcn-btcaddress-first-" + i + "'></div>" +
			"<div class='btcaddress second' id='usergenbcn-btcaddress-second-" + i + "'></div>" +
			"<div class='btcaddress-last4' id='usergenbcn-btcaddress-last4-" + i + "'></div>" +
			"<div class='header-text warning' id='usergenbcn-warning-text-" + i + "'></div>" +
			"<div class='header-text learn' id='usergenbcn-learn-text-" + i + "'></div>" +
			"<div class='header-text revolution' id='usergenbcn-revolution-text-" + i + "'></div>" +
			"<div class='qrprivate-top-text' id='usergenbcn-qrprivate-top-text-" + i + "'></div>" +
			"<img id='usergenbcn-bitcoincashlogo" + i + "' class='bitcoincashlogo' src='' />" +
			"<div class='logo-text' id='usergenbcn-logo-text-" + i + "'></div>" +
			"<div class='paperface'><img id='usergenbcn-paperface" + i + "' class='paperfaceimage' src='' /></div>" +
			"<img id='usergenbcn-numberedDenominationFrontFirst" + i + "' class='numberedDenominationFrontFirst' src='' />" +
			"<img id='usergenbcn-numberedDenominationFrontSecond" + i + "' class='numberedDenominationFrontSecond' src='' />" +
			"<img id='usergenbcn-colouredNumberedDenominationFrontFirst" + i + "' class='colouredNumberedDenominationFrontFirst' src='' />" +
			"<img id='usergenbcn-colouredNumberedDenominationFrontSecond" + i + "' class='colouredNumberedDenominationFrontSecond' src='' />" +
			"<img id='usergenbcn-wordedDenominationFront" + i + "' class='wordedDenominationFront' src='' />" +
			"<img id='usergenbcn-milliBitcoinCashFront" + i + "' class='milliBitcoinCashFront' src='' />" +

			// Back Elements
			"<img class='back-color' id='usergenbcn-back-color" + i + "' src='' />" +
			"<img id='usergenbcn-bitcoincashback" + i + "' class='bitcoincashback' src='' />" +
			"<img id='usergenbcn-crypto-trust-" + i + "' class='crypto-trust' src='' />" +
			"<div class='private-key-cover-text private-key' id='usergenbcn-private-key-text-" + i + "'></div>" +
			"<div class='private-key-cover-text underneath' id='usergenbcn-underneath-text-" + i + "'></div>" +
			"<div class='private-key-cover-text keep' id='usergenbcn-keep-text-" + i + "'></div>" +
			"<div class='private-key-cover-text secret' id='usergenbcn-secret-text-" + i + "'></div>" +
			"<div class='open-here' id='usergenbcn-open-here-" + i + "'></div>" +
			"<div class='btcprivwif first' id='usergenbcn-btcprivwif-first-" + i + "'></div>" +
			"<div class='btcprivwif second' id='usergenbcn-btcprivwif-second-" + i + "'></div>" +
			"<div class='btcprivwif third' id='usergenbcn-btcprivwif-third-" + i + "'></div>" +
			"<div class='btcprivwif fourth' id='usergenbcn-btcprivwif-fourth-" + i + "'></div>" +
			"<div class='btcprivwif fifth' id='usergenbcn-btcprivwif-fifth-" + i + "'></div>" +
			"<div class='btcprivwif sixth' id='usergenbcn-btcprivwif-sixth-" + i + "'></div>" +
			"<img id='usergenbcn-numberedDenominationBackFirst" + i + "' class='numberedDenominationBackFirst' src='' />" +
			"<img id='usergenbcn-numberedDenominationBackSecond" + i + "' class='numberedDenominationBackSecond' src='' />" +
			"<img id='usergenbcn-wordedDenominationBack" + i + "' class='wordedDenominationBack' src='' />" +
			"<img id='usergenbcn-milliBitcoinCashBack" + i + "' class='milliBitcoinCashBack' src='' />" +

			"</div>";
		return walletHtml;
	},

	showArtisticWallet: function (idPostFix, bitcoinBCHAddress, privateKey) {
		var keyValuePair = {};
		keyValuePair["usergenbcn-qrcode_public" + idPostFix] = bitcoinBCHAddress;
		keyValuePair["usergenbcn-qrcode_private-" + idPostFix] = privateKey;
		ninja.qrCode.showQrCode(keyValuePair);
		var bchaddressformat = bitcoinBCHAddress.replace(/^.*:/, '');
		document.getElementById("usergenbcn-btcaddress-first-" + idPostFix).innerHTML = bchaddressformat.slice(0, 21);
		document.getElementById("usergenbcn-btcaddress-second-" + idPostFix).innerHTML = bchaddressformat.slice(21, 42);
		document.getElementById("usergenbcn-btcaddress-last4-" + idPostFix).innerHTML = bchaddressformat.slice(38, 42);

		if (ninja.wallets.paperwallet.encrypt) {
			var half = privateKey.length / 2;
			document.getElementById("usergenbcn-btcencryptedkey" + idPostFix).innerHTML = privateKey.slice(0, half) + '<br />' + privateKey.slice(half);
		} else {
			document.getElementById("usergenbcn-btcprivwif-first-" + idPostFix).innerHTML = privateKey.slice(0, 9);
			document.getElementById("usergenbcn-btcprivwif-second-" + idPostFix).innerHTML = privateKey.slice(9, 18);
			document.getElementById("usergenbcn-btcprivwif-third-" + idPostFix).innerHTML = privateKey.slice(18, 27);
			document.getElementById("usergenbcn-btcprivwif-fourth-" + idPostFix).innerHTML = privateKey.slice(27, 36);
			document.getElementById("usergenbcn-btcprivwif-fifth-" + idPostFix).innerHTML = privateKey.slice(36, 45);
			document.getElementById("usergenbcn-btcprivwif-sixth-" + idPostFix).innerHTML = privateKey.slice(45, 52);
		}
	},

	resetOptions: function () {
		document.getElementById("usergenbcn-paperwalletlanguage").value = 'english';
		document.getElementById("usergenbcn-paperwalletdenomination").value = '1mbch';
		document.getElementById("usergenbcn-paperwalletcolor").value = 'Orange';
		document.getElementById("usergenbcn-faceimagebutton").value = '';

		ninja.wallets.paperwallet.changeLanguage();
		ninja.wallets.paperwallet.changeDenomination();
		ninja.wallets.paperwallet.changeColor();

		var defaultFaceImage = ninja.images.paperwalletimages()['default']['standardFace'];
		ninja.wallets.paperwallet.updateImageElements('paperfaceimage', defaultFaceImage);
	},

	inputNewFace: function (input) {
		if (input.files && input.files[0]) {
			var reader = new FileReader();
			reader.onload = function(e) {
				ninja.wallets.paperwallet.updateImageElements('paperfaceimage', e.target.result);
			}
			reader.readAsDataURL(input.files[0]);
		}
	},

	changeDenomination: function () {
		var newDenomination = document.getElementById("usergenbcn-paperwalletdenomination").value;
		ninja.wallets.paperwallet.currentMilli = parseInt(newDenomination.replace('mbch',''));
		var paperwalletcolor = document.getElementById("usergenbcn-paperwalletcolor").value.toLowerCase();
		var language = document.getElementById('usergenbcn-paperwalletlanguage').value.toLowerCase();

		var numberedDenominationFront = ninja.denominationimages()[newDenomination]['numberedDenominationFront'];
		ninja.wallets.paperwallet.updateImageElements('numberedDenominationFrontFirst', numberedDenominationFront);
		ninja.wallets.paperwallet.updateImageElements('numberedDenominationFrontSecond', numberedDenominationFront);

		var colouredNumberedDenominationFront = ninja.denominationimages()[newDenomination]['colouredNumberedDenominationFront'][paperwalletcolor];
		ninja.wallets.paperwallet.updateImageElements('colouredNumberedDenominationFrontFirst', colouredNumberedDenominationFront);
		ninja.wallets.paperwallet.updateImageElements('colouredNumberedDenominationFrontSecond', colouredNumberedDenominationFront);

		var wordedDenominationFront = ninja.denominationimages()[newDenomination]['wordedDenominationFront'][language];
		ninja.wallets.paperwallet.updateImageElements('wordedDenominationFront', wordedDenominationFront);

		var milliBitcoinCashFront = ninja.images.paperwalletimages()['default']['milliBitcoinCash']['front'];
		ninja.wallets.paperwallet.updateImageElements('milliBitcoinCashFront', milliBitcoinCashFront);

		var numberedDenominationBack = ninja.denominationimages()[newDenomination]['numberedDenominationBack'];
		ninja.wallets.paperwallet.updateImageElements('numberedDenominationBackFirst', numberedDenominationBack);
		ninja.wallets.paperwallet.updateImageElements('numberedDenominationBackSecond', numberedDenominationBack);

		var wordedDenominationBack = ninja.denominationimages()[newDenomination]['colouredTranslatedWordedDenominationBack'][paperwalletcolor][language];
		ninja.wallets.paperwallet.updateImageElements('wordedDenominationBack', wordedDenominationBack);

		var milliBitcoinCashBack = ninja.images.paperwalletimages()['default']['milliBitcoinCash']['back'][paperwalletcolor];
		ninja.wallets.paperwallet.updateImageElements('milliBitcoinCashBack', milliBitcoinCashBack);

		var styles = ninja.wallets.paperwallet.getStylesRef(newDenomination, language);
		ninja.wallets.paperwallet.updateStyles(styles);
	},

	changeColor: function () {
		var selectedColor = document.getElementById('usergenbcn-paperwalletcolor').value;
		var selectedDenomination = document.getElementById("usergenbcn-paperwalletdenomination").value;
		var hexColour = ninja.wallets.paperwallet.getHexColours()[selectedColor];
		var language = document.getElementById('usergenbcn-paperwalletlanguage').value;
		var paperwalletcolor = document.getElementById("usergenbcn-paperwalletcolor").value.toLowerCase();
		var styles = [];

		var backImage = ninja.images.paperwalletimages()['default']['standardBack'][selectedColor.toLowerCase()];
		var bitcoincashLogoImage = ninja.images.paperwalletimages()['default']['bitcoincashLogo'][selectedColor.toLowerCase()];
		var bitcoincashBackImage = ninja.images.paperwalletimages()['default']['bitcoincashBack'][selectedColor.toLowerCase()];

		var colouredNumberedDenominationFront = ninja.denominationimages()[selectedDenomination]['colouredNumberedDenominationFront'][selectedColor.toLowerCase()];
		ninja.wallets.paperwallet.updateImageElements('colouredNumberedDenominationFrontFirst', colouredNumberedDenominationFront);
		ninja.wallets.paperwallet.updateImageElements('colouredNumberedDenominationFrontSecond', colouredNumberedDenominationFront);

		var wordedDenominationBack = ninja.denominationimages()[selectedDenomination]['colouredTranslatedWordedDenominationBack'][paperwalletcolor][language];
		ninja.wallets.paperwallet.updateImageElements('wordedDenominationBack', wordedDenominationBack);

		var milliBitcoinCashBack = ninja.images.paperwalletimages()['default']['milliBitcoinCash']['back'][paperwalletcolor];
		ninja.wallets.paperwallet.updateImageElements('milliBitcoinCashBack', milliBitcoinCashBack);

		ninja.wallets.paperwallet.updateImageElements('back-color', backImage);
		ninja.wallets.paperwallet.updateImageElements('bitcoincashlogo', bitcoincashLogoImage);
		ninja.wallets.paperwallet.updateImageElements('bitcoincashback', bitcoincashBackImage);

		styles.push({ className: 'header-text revolution', styleChanges: [{ property: 'color', value: hexColour }] });
		ninja.wallets.paperwallet.updateStyles(styles);
	},

	changeLanguage: function (selectedLanguage) {
		var language;
		var styles = [];

		if (selectedLanguage) {
			language = selectedLanguage;
		} else {
			language = document.getElementById('usergenbcn-paperwalletlanguage').value;
		}

		var selectedDenomination = document.getElementById("usergenbcn-paperwalletdenomination").value;
		var paperwalletcolor = document.getElementById("usergenbcn-paperwalletcolor").value.toLowerCase();
		var logoText = ninja.wallets.paperwallet.getTranslations()[language]['logo-text'];
		ninja.wallets.paperwallet.updateTextElements('logo-text', logoText);

		var headerTexts = ninja.wallets.paperwallet.getTranslations()[language]['header-text'];
		var headerTextWarning = headerTexts['warning'];
		var headerTextLearn = headerTexts['learn'];
		var headerTextRevolution = headerTexts['revolution'];
		ninja.wallets.paperwallet.updateTextElements('header-text warning', headerTextWarning);
		ninja.wallets.paperwallet.updateTextElements('header-text learn', headerTextLearn);
		ninja.wallets.paperwallet.updateTextElements('header-text revolution', headerTextRevolution);

		var qrPrivateTopText = ninja.wallets.paperwallet.getTranslations()[language]['qrprivate-top-text'];
		ninja.wallets.paperwallet.updateTextElements('qrprivate-top-text', qrPrivateTopText);

		var cryptoTrustImage = ninja.images.paperwalletimages()['default']['cryptoTrust'][language];
		ninja.wallets.paperwallet.updateImageElements('crypto-trust', cryptoTrustImage);

		var privateKeyCoverTexts = ninja.wallets.paperwallet.getTranslations()[language]['private-key-cover-text'];
		var privateKeyCoverTextPrivateKey = privateKeyCoverTexts['private-key'];
		var privateKeyCoverTextUnderneath = privateKeyCoverTexts['underneath'];
		var privateKeyCoverTextKeep = privateKeyCoverTexts['keep'];
		var privateKeyCoverTextSecret = privateKeyCoverTexts['secret'];

		ninja.wallets.paperwallet.updateTextElements('private-key-cover-text private-key', privateKeyCoverTextPrivateKey);
		ninja.wallets.paperwallet.updateTextElements('private-key-cover-text underneath', privateKeyCoverTextUnderneath);
		ninja.wallets.paperwallet.updateTextElements('private-key-cover-text keep', privateKeyCoverTextKeep);
		ninja.wallets.paperwallet.updateTextElements('private-key-cover-text secret', privateKeyCoverTextSecret);

		var openHereText = ninja.wallets.paperwallet.getTranslations()[language]['open-here'];
		ninja.wallets.paperwallet.updateTextElements('open-here', openHereText);

		var wordedDenominationFront = ninja.denominationimages()[selectedDenomination]['wordedDenominationFront'][language];
		ninja.wallets.paperwallet.updateImageElements('wordedDenominationFront', wordedDenominationFront);

		var wordedDenominationBack = ninja.denominationimages()[selectedDenomination]['colouredTranslatedWordedDenominationBack'][paperwalletcolor][language];
		ninja.wallets.paperwallet.updateImageElements('wordedDenominationBack', wordedDenominationBack);

		styles = styles.concat(styles, ninja.wallets.paperwallet.getStylesRef(selectedDenomination, language));
		ninja.wallets.paperwallet.updateStyles(styles);
	},

	updateTextElements: function (className, text) {
		var wrapperDocument = document.getElementsByClassName('usergenbcn-body-wrapper')[0];
		var elements = wrapperDocument.getElementsByClassName(className);
		for (var index = 0; index < elements.length; index++) {
			elements[index].innerHTML = text;
		}
	},

	updateImageElements: function (className, image) {
		var wrapperDocument = document.getElementsByClassName('usergenbcn-body-wrapper')[0];
		var elements = wrapperDocument.getElementsByClassName(className);
		for (var index = 0; index < elements.length; index++) {
			elements[index].src = image;
		}
	},

	updateStyles: function (styles) {
		for (var index = 0; index < styles.length; index++) {
			var wrapperDocument = document.getElementsByClassName('usergenbcn-body-wrapper')[0];
			var styleChangeElements = wrapperDocument.getElementsByClassName(styles[index].className);
			for (var j = 0; j < styleChangeElements.length; j++) {
				var styleChanges = styles[index].styleChanges;
				for (var k = 0; k < styleChanges.length; k++) {
					styleChangeElements[j].style[styleChanges[k].property] = styleChanges[k].value;
				}
			}
		}
	},

	getStylesRef: function (denomination, language) {
		var styleRef = {
			'all-denominations': {
				english: [
					{ className: 'crypto-trust', styleChanges: [{ property: 'top', value: '188px' }] },
					{ className: 'qrprivate-top-text', styleChanges: [{ property: 'left', value: '385px' }] }
				],
				spanish: [
					{ className: 'crypto-trust', styleChanges: [{ property: 'top', value: '185px' }] },
					{ className: 'qrprivate-top-text', styleChanges: [{ property: 'left', value: '373px' }] }
				],
			},
			'1mbch': {
				'all-languages': [{ className: 'numberedDenominationFrontSecond', styleChanges: [{ property: 'top', value: '430px' }] }],
				english: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '145px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '190px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '358px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '130px' }] },
				],
				spanish: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '145px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '192px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '358px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '130px' }] },
				],
			},
			'2mbch': {
				'all-languages': [{ className: 'numberedDenominationFrontSecond', styleChanges: [{ property: 'top', value: '429px' }] }],
				english: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '144px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '193px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '358px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '130px' }] },
				],
				spanish: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '145px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '192px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '358px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '130px' }] },
				],
			},
			'5mbch': {
				'all-languages': [{ className: 'numberedDenominationFrontSecond', styleChanges: [{ property: 'top', value: '429px' }] }],
				english: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '142px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '196px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '354px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '126px' }] },
				],
				spanish: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '138px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '202px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '348px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '120px' }] },
				],
			},
			'10mbch': {
				'all-languages': [{ className: 'numberedDenominationFrontSecond', styleChanges: [{ property: 'top', value: '410px' }] }],
				english: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '147px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '193px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '358px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '130px' }] },
				],
				spanish: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '142px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '195px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '354px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '126px' }] },
				],
			},
			'20mbch': {
				'all-languages': [{ className: 'numberedDenominationFrontSecond', styleChanges: [{ property: 'top', value: '410px' }] }],
				english: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '128px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '212px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '332px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '104px' }] },
				],
				spanish: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '129px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '208px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '336px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '110px' }] },
				],
			},
			'50mbch': {
				'all-languages': [{ className: 'numberedDenominationFrontSecond', styleChanges: [{ property: 'top', value: '410px' }] }],
				english: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '138px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '201px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '348px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '120px' }] },
				],
				spanish: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '111px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '224px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '316px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '90px' }] },
				],
			},
			'100mbch': {
				'all-languages': [{ className: 'numberedDenominationFrontSecond', styleChanges: [{ property: 'top', value: '395px' }] }],
				english: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '97px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '243px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '300px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '73px' }] },
				],
				spanish: [
					{ className: 'wordedDenominationFront', styleChanges: [{ property: 'top', value: '142px' }] },
					{ className: 'milliBitcoinCashFront', styleChanges: [{ property: 'top', value: '197px' }] },
					{ className: 'wordedDenominationBack', styleChanges: [{ property: 'top', value: '354px' }] },
					{ className: 'milliBitcoinCashBack', styleChanges: [{ property: 'top', value: '126px' }] },
				],
			},
		};

		var styles = [].concat(styleRef['all-denominations'][language]);
		styles = styles.concat(styleRef[denomination]['all-languages']);
		styles = styles.concat(styleRef[denomination][language]);

		return styles;
	},

	getHexColours: function () {
		var hexColours = {
			'Orange': '#f08b16',
			'Green': '#007c00',
			'Red': '#bf0000',
			'Black': '#000000',
			'Blue': '#1412a0',
			'Gold': '#cdac00'
		};

		return hexColours;
	},

	getTranslations: function () {
		var translations = {
			english: {
				'logo-text': 'peer-to-peer electronic cash',
				'qrprivate-top-text': 'SWEEP FUNDS',
				'open-here': 'OPEN HERE',
				'header-text': {
					'warning': 'Warning: This note is insecure, use it at your own risk.',
					'learn': 'Learn how to use Bitcoin Cash: <span>bitcoincashnotes.com/instructions</span>',
					'revolution': 'The revolution will not be centralized'
				},
				'private-key-cover-text': {
					'private-key': 'PRIVATE KEY',
					'underneath': 'UNDERNEATH',
					'keep': 'KEEP',
					'secret': 'SECRET'
				}
			},
			spanish: {
				'logo-text': 'peer-to-peer dinero electrónico',
				'qrprivate-top-text': 'FONDOS DE BARRIDO',
				'open-here': 'ABRIR AQUÍ',
				'header-text': {
					'warning': 'Advertencia: esta nota es insegura, úsela bajo su propio riesgo.',
					'learn': 'Aprende a usar Bitcoin Cash: <span>bitcoincashnotes.com/instrucciones</span>',
					'revolution': 'La revolución no será centralizada'
				},
				'private-key-cover-text': {
					'private-key': 'LLAVE PRIVADA',
					'underneath': 'DEBAJO',
					'keep': 'MANTENER',
					'secret': 'SECRETO'
				}
			}
		};

		return translations;
	},
};

(function (wallets, qrCode, privateKey, translator) {
	var detail = wallets.detailwallet = {
		isOpen: function () {
			return (document.getElementById("usergenbcn-detailwallet").className.indexOf("selected") != -1);
		},

		open: function () {
			document.getElementById("usergenbcn-detailarea").style.display = "block";
			document.getElementById("usergenbcn-detailprivkey").focus();
		},

		close: function () {
			document.getElementById("usergenbcn-detailarea").style.display = "none";
		},

		openCloseFaq: function (faqNum) {
			// do close
			if (document.getElementById("usergenbcn-detaila" + faqNum).style.display == "block") {
				document.getElementById("usergenbcn-detaila" + faqNum).style.display = "none";
				document.getElementById("usergenbcn-detaile" + faqNum).setAttribute("class", "more");
			}
			// do open
			else {
				document.getElementById("usergenbcn-detaila" + faqNum).style.display = "block";
				document.getElementById("usergenbcn-detaile" + faqNum).setAttribute("class", "less");
			}
		},

		getKeyFromInput: function () {
			var key = document.getElementById("usergenbcn-detailprivkey").value.toString().replace(/^\s+|\s+$/g, ""); // trim white space
			document.getElementById("usergenbcn-detailprivkey").value = key;
			return key;
		},

		checkAndShowMini: function (key) {
			if (Bitcoin.ECKey.isMiniFormat(key)) {
				// show Private Key Mini Format
				document.getElementById("usergenbcn-detailprivmini").innerHTML = key;
				document.getElementById("usergenbcn-detailmini").style.display = "block";
			}
		},

		checkAndShowBase6: function (key) {
			if (Bitcoin.ECKey.isBase6Format(key)) {
				// show Private Key Base6 Format
				document.getElementById("usergenbcn-detailprivb6").innerHTML = key;
				document.getElementById("usergenbcn-detailb6").style.display = "block";
			}
		},

		keyToECKeyWithBrain: function (key) {
			var btcKey = new Bitcoin.ECKey(key);
			if (btcKey.error != null) {
				alert(translator.get("detailalertnotvalidprivatekey") + "\n" + btcKey.error);
			}
			return btcKey;
		},

		decryptBip38: function () {
			detail.clear();
			var key = detail.getKeyFromInput();
			if (key == "") {
				return;
			}
			if (privateKey.isBIP38Format(key) == false) {
				return;
			}
			document.getElementById("usergenbcn-detailbip38toggle").style.display = "none";
			var passphrase = document.getElementById("usergenbcn-detailprivkeypassphrase").value.toString()
			if (passphrase == "") {
				alert(translator.get("bip38alertpassphraserequired"));
				return;
			}
			document.getElementById("usergenbcn-busyblock").className = "busy";
			// show Private Key BIP38 Format
			document.getElementById("usergenbcn-detailprivbip38").innerHTML = key;
			document.getElementById("usergenbcn-detailbip38").style.display = "block";
			qrCode.showQrCode({
				"usergenbcn-detailqrcodeprivatebip38": key
			}, 4);
			privateKey.BIP38EncryptedKeyToByteArrayAsync(key, passphrase, function (btcKeyOrError) {
				document.getElementById("usergenbcn-busyblock").className = "";
				if (btcKeyOrError.message) {
					alert(btcKeyOrError.message);
					detail.clear();
				} else {
					detail.populateKeyDetails(new Bitcoin.ECKey(btcKeyOrError));
				}
			});
		},

		encryptBip38: function () {
			detail.clear();
			var key = detail.getKeyFromInput();
			if (key == "") {
				return;
			}
			if (privateKey.isBIP38Format(key)) {
				return;
			}
			detail.checkAndShowMini(key);
			detail.checkAndShowBase6(key);
			var btcKey = detail.keyToECKeyWithBrain(key);
			if (btcKey.priv == null) {
				return;
			}
			var detailEncryptCheckbox = document.getElementById("usergenbcn-detailbip38checkbox");
			if (detailEncryptCheckbox.checked == true) {
				document.getElementById("usergenbcn-detailbip38commands").style.display = "block";
				var passphrase = document.getElementById("usergenbcn-detailprivkeypassphrase").value.toString()
				if (passphrase == "") {
					alert(translator.get("bip38alertpassphraserequired"));
					return;
				}
				document.getElementById("usergenbcn-busyblock").className = "busy";
				privateKey.BIP38PrivateKeyToEncryptedKeyAsync(btcKey.getBitcoinWalletImportFormat(), passphrase, btcKey.compressed, function (encryptedKey) {
					qrCode.showQrCode({
						"usergenbcn-detailqrcodeprivatebip38": encryptedKey
					}, 4);
					// show Private Key BIP38 Format
					document.getElementById("usergenbcn-detailprivbip38").innerHTML = encryptedKey;
					document.getElementById("usergenbcn-detailbip38").style.display = "block";
					document.getElementById("usergenbcn-busyblock").className = "";
				});
				detail.populateKeyDetails(btcKey);
			}
		},

		viewDetails: function () {
			detail.clear();
			document.getElementById("usergenbcn-detailbip38checkbox").checked = false;
			var key = detail.getKeyFromInput();
			if (key == "") {
				return;
			}
			if (privateKey.isBIP38Format(key)) {
				document.getElementById("usergenbcn-detailbip38commands").style.display = "block";
				document.getElementById("usergenbcn-detailprivkeypassphrase").focus();
				return;
			}
			document.getElementById("usergenbcn-detailbip38commands").style.display = "none";
			detail.checkAndShowMini(key);
			detail.checkAndShowBase6(key);
			var btcKey = detail.keyToECKeyWithBrain(key);
			if(btcKey.priv == null){
				return;
			}
			detail.populateKeyDetails(btcKey);
		},

		populateKeyDetails: function (btcKey) {
			if (btcKey.priv != null) {
				// get the original compression value and set it back later in this function
				var originalCompression = btcKey.compressed;
				btcKey.setCompressed(false);
				document.getElementById("usergenbcn-detailprivhex").innerHTML = btcKey.toString().toUpperCase();
				document.getElementById("usergenbcn-detailprivb64").innerHTML = btcKey.toString("base64");
				var bitcoinAddress = bchaddr.toCashAddress(btcKey.getBitcoinAddress());
				var wif = btcKey.getBitcoinWalletImportFormat();
				document.getElementById("usergenbcn-detailpubkey").innerHTML = btcKey.getPubKeyHex();
				document.getElementById("usergenbcn-detailaddress").innerHTML = bitcoinAddress;
				document.getElementById("usergenbcn-detailprivwif").innerHTML = wif;
				btcKey.setCompressed(true);
				var bitcoinAddressComp = bchaddr.toCashAddress(btcKey.getBitcoinAddress());
				var wifComp = btcKey.getBitcoinWalletImportFormat();			
				document.getElementById("usergenbcn-detailpubkeycomp").innerHTML = btcKey.getPubKeyHex();
				document.getElementById("usergenbcn-detailaddresscomp").innerHTML = bitcoinAddressComp;
				document.getElementById("usergenbcn-detailprivwifcomp").innerHTML = wifComp;
				btcKey.setCompressed(originalCompression); // to satisfy the key pool
				var pool1 = new Bitcoin.ECKey(wif); // to satisfy the key pool
				var pool2 = new Bitcoin.ECKey(wifComp); // to satisfy the key pool

				qrCode.showQrCode({
					"usergenbcn-detailqrcodepublic": bitcoinAddress,
					"usergenbcn-detailqrcodepubliccomp": bitcoinAddressComp,
					"usergenbcn-detailqrcodeprivate": wif,
					"usergenbcn-detailqrcodeprivatecomp": wifComp
				}, 4);
			}
		},

		clear: function () {
			var key = detail.getKeyFromInput();
			if (privateKey.isBIP38Format(key)) {
				document.getElementById("usergenbcn-detailbip38commands").style.display = "block";
				document.getElementById("usergenbcn-detailbip38toggle").style.display = "none";
				document.getElementById("usergenbcn-detailbip38decryptspan").style.display = "inline-block";
				document.getElementById("usergenbcn-detailbip38encryptspan").style.display = "none";
				document.getElementById("usergenbcn-detailbip38checkbox").checked = false;
			}
			else {
				document.getElementById("usergenbcn-detailbip38toggle").style.display = "block";
				if (document.getElementById("usergenbcn-detailbip38checkbox").checked) {
					document.getElementById("usergenbcn-detailbip38commands").style.display = "block";
					document.getElementById("usergenbcn-detailbip38decryptspan").style.display = "none";
					document.getElementById("usergenbcn-detailbip38encryptspan").style.display = "inline-block";
				}
				else {
					document.getElementById("usergenbcn-detailbip38commands").style.display = "none";
					document.getElementById("usergenbcn-detailbip38decryptspan").style.display = "inline-block";
					document.getElementById("usergenbcn-detailbip38encryptspan").style.display = "none";
				}
			}
			document.getElementById("usergenbcn-detailpubkey").innerHTML = "";
			document.getElementById("usergenbcn-detailpubkeycomp").innerHTML = "";
			document.getElementById("usergenbcn-detailaddress").innerHTML = "";
			document.getElementById("usergenbcn-detailaddresscomp").innerHTML = "";
			document.getElementById("usergenbcn-detailprivwif").innerHTML = "";
			document.getElementById("usergenbcn-detailprivwifcomp").innerHTML = "";
			document.getElementById("usergenbcn-detailprivhex").innerHTML = "";
			document.getElementById("usergenbcn-detailprivb64").innerHTML = "";
			document.getElementById("usergenbcn-detailprivb6").innerHTML = "";
			document.getElementById("usergenbcn-detailprivmini").innerHTML = "";
			document.getElementById("usergenbcn-detailprivbip38").innerHTML = "";
			document.getElementById("usergenbcn-detailqrcodepublic").innerHTML = "";
			document.getElementById("usergenbcn-detailqrcodepubliccomp").innerHTML = "";
			document.getElementById("usergenbcn-detailqrcodeprivate").innerHTML = "";
			document.getElementById("usergenbcn-detailqrcodeprivatecomp").innerHTML = "";
			document.getElementById("usergenbcn-detailb6").style.display = "none";
			document.getElementById("usergenbcn-detailmini").style.display = "none";
			document.getElementById("usergenbcn-detailbip38").style.display = "none";
		},

		enterOnPassphrase: function () {
			var detailEncryptCheckbox = document.getElementById("usergenbcn-detailbip38checkbox");
			if (detailEncryptCheckbox.checked) {
				detail.encryptBip38();
			}
			else {
				detail.decryptBip38();
			}
		},

		toggleEncrypt: function (element) {
			// enable/disable passphrase textbox
			var bip38CommandDisplay = document.getElementById("usergenbcn-detailbip38commands").style.display;
			var key = detail.getKeyFromInput();

			if (element.checked == true) {
				if (privateKey.isBIP38Format(key)) {
					document.getElementById("usergenbcn-detailbip38toggle").style.display = "none";
					document.getElementById("usergenbcn-detailbip38commands").style.display = "block";
					document.getElementById("usergenbcn-detailprivkeypassphrase").focus();
					return;
				}
				else {
					// show encrypt button
					document.getElementById("usergenbcn-detailbip38commands").style.display = "block";
					document.getElementById("usergenbcn-detailprivkeypassphrase").focus();
					document.getElementById("usergenbcn-detailbip38decryptspan").style.display = "none";
					document.getElementById("usergenbcn-detailbip38encryptspan").style.display = "inline-block";
				}
			}
			else {
				// show decrypt button
				document.getElementById("usergenbcn-detailbip38decryptspan").style.display = "inline-block";
				document.getElementById("usergenbcn-detailbip38encryptspan").style.display = "none";
				document.getElementById("usergenbcn-detailbip38commands").style.display = "none";
			}
		}
	};
})(ninja.wallets, ninja.qrCode, ninja.privateKey, ninja.translator);
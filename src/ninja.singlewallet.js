(function (wallets, qrCode) {
	var single = wallets.singlewallet = {
		isOpen: function () {
			return (document.getElementById("usergenbcn-singlewallet").className.indexOf("selected") != -1);
		},

		open: function () {
			if (document.getElementById("usergenbcn-btcaddress").innerHTML == "") {
				single.generateNewAddressAndKey();
			}
			document.getElementById("usergenbcn-singlearea").style.display = "block";
		},

		close: function () {
			document.getElementById("usergenbcn-singlearea").style.display = "none";
		},

		// generate bitcoin address and private key and update information in the HTML
		generateNewAddressAndKey: function () {
			try {
				var key = new Bitcoin.ECKey(false);
				key.setCompressed(true);
				var bitcoinAddress = bchaddr.toCashAddress(key.getBitcoinAddress());
				var privateKeyWif = key.getBitcoinWalletImportFormat();
				document.getElementById("usergenbcn-btcaddress").innerHTML = bitcoinAddress;
				document.getElementById("usergenbcn-btcprivwif").innerHTML = privateKeyWif;
				var keyValuePair = {
					"usergenbcn-qrcode_public": bitcoinAddress,
					"usergenbcn-qrcode_private": privateKeyWif
				};
				qrCode.showQrCode(keyValuePair, 4);
			}
			catch (e) {
				// browser does not have sufficient JavaScript support to generate a bitcoin address
				alert(e);
				document.getElementById("usergenbcn-btcaddress").innerHTML = "error";
				document.getElementById("usergenbcn-btcprivwif").innerHTML = "error";
				document.getElementById("usergenbcn-qrcode_public").innerHTML = "";
				document.getElementById("usergenbcn-qrcode_private").innerHTML = "";
			}
		}
	};
})(ninja.wallets, ninja.qrCode);
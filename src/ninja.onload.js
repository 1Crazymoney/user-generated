// run unit tests
if (ninja.getQueryString()["unittests"] == "true" || ninja.getQueryString()["unittests"] == "1") {
	ninja.unitTests.runSynchronousTests(true);
	ninja.translator.showEnglishJson();
}
// run async unit tests
if (ninja.getQueryString()["asyncunittests"] == "true" || ninja.getQueryString()["asyncunittests"] == "1") {
	ninja.unitTests.runAsynchronousTests(true);
}
// change language
ninja.translator.extractEnglishFromDomAndUpdateDictionary();
if (ninja.getQueryString()["culture"] != undefined) {
	ninja.translator.translate(ninja.getQueryString()["culture"]);
} else {
	ninja.translator.autoDetectTranslation();
}
// testnet, check if testnet edition should be activated
if (ninja.getQueryString()["testnet"] == "true" || ninja.getQueryString()["testnet"] == "1") {
	document.getElementById("usergenbcn-testnet").innerHTML = ninja.translator.get("testneteditionactivated");
	document.getElementById("usergenbcn-testnet").style.display = "block";
	document.getElementById("usergenbcn-detailwifprefix").innerHTML = "'9'";
	document.getElementById("usergenbcn-detailcompwifprefix").innerHTML = "'c'";
	Bitcoin.Address.networkVersion = 0x6F; // testnet
	Bitcoin.ECKey.privateKeyPrefix = 0xEF; // testnet
	ninja.testnetMode = true;
}
if (ninja.getQueryString()["showseedpool"] == "true" || ninja.getQueryString()["showseedpool"] == "1") {
	document.getElementById("usergenbcn-seedpoolarea").style.display = "block";
}
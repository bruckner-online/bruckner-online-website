import assert from "node:assert/strict";
import { test } from "node:test";

import { createImgproxyUrl } from "../src/lib/imgproxy.ts";

const imgproxyUrl = createImgproxyUrl({
	baseUrl: "https://images.example.org/",
	key: "dacf85e6b235049d4b2b1b4fe92de8654bb089bbd7331f330ef75f533076bbef",
	salt: "c35ebfa16f4924cda219f8ac18e803ae617e8d41bc9c19f00a38a340704b6827",
	bucketName: "bruckner-online-lexikon",
});

void test("signs URLs as imgproxy expects", () => {
	// Accepted by imgproxy v4 with this key and salt (see `tests/smoke/images.test.ts`).
	assert.equal(
		imgproxyUrl("notenbeispiele/Gedenkstätten Testbild.png", { width: 800 }),
		"https://images.example.org/sab874f5fHpHpK6OmCbc2FCLwvglV11PaRN3BDPDwtA/rs:fit:800:0/czM6Ly9icnVja25lci1vbmxpbmUtbGV4aWtvbi9ub3RlbmJlaXNwaWVsZS9HZWRlbmtzdMOkdHRlbiBUZXN0YmlsZC5wbmc",
	);
});

void test("passes object keys unencoded and bounds both dimensions when asked", () => {
	const url = imgproxyUrl("abbildungen/Ä b.png", { width: 2560, height: 2560 });
	const [, , , , options, source] = url.split("/");
	assert.equal(options, "rs:fit:2560:2560");
	assert.equal(
		Buffer.from(source ?? "", "base64url").toString(),
		"s3://bruckner-online-lexikon/abbildungen/Ä b.png",
	);
});

import path from "path";
const fs = require("fs");
import { PointG1 } from "@noble/bls12-381";
const circom_tester = require("circom_tester");
const wasm_tester = circom_tester.wasm;
const buildPoseidon = require("circomlibjs").buildPoseidon;

async function poseidon_aggregation(arr: bigint[]) {
    let poseidon = await buildPoseidon();
    let F = poseidon.F;
    let num_eles = arr.length;
    var total_poseidon = (((num_eles) / 15) | 0) + 1;
    let poseidon_aggregator = [];
    for (var i = 0; i < total_poseidon; i++) {
        var poseidonSize = 16;
        if (i == 0) poseidonSize = 15;
        let inputs = [];
        for (var j = 0; j < 15; j++) {
            if (i * 15 + j >= num_eles) {
                inputs.push(0);
            } else {
                inputs.push(arr[i * 15 + j]);
            }
        }
        if (i > 0) {
            inputs.push(poseidon_aggregator[i - 1]);
        }
        poseidon_aggregator.push(F.toObject(poseidon(inputs)));
    }
    return poseidon_aggregator[total_poseidon - 1];

}


function bigint_to_array(n: number, k: number, x: bigint) {
    let mod: bigint = 1n;
    for (var idx = 0; idx < n; idx++) {
        mod = mod * 2n;
    }

    let ret: bigint[] = [];
    var x_temp: bigint = x;
    for (var idx = 0; idx < k; idx++) {
        ret.push(x_temp % mod);
        x_temp = x_temp / mod;
    }
    return ret;
}

function point_to_bigint(point: PointG1): [bigint, bigint] {
    let [x, y] = point.toAffine();
    return [x.value, y.value];
}

const private_keys = [
    "0x06a680317cbb1cf70c700b672e48ed01fe5fd51427808a96e17611506e13aed9",
    "0x432bcfbda728fd60570db9505d0b899a9c7c8971ec0fd58252d8028ac0aa76ce",
    "0x6688391de4d32b5779ff669fb72f81b9aaff44e926ba19d5833c5a5c50dd40d2",
    "0x4c24c0c5360b7c44210697a5fba1f705456f37969e1354e30cbd0f290d2efd4a",
];

describe("poseidon-commitments", function () {
    this.timeout(1000 * 1000);

    let circuit: any;
    let options = { include: __dirname, output: "tmp_output", verbose: true };
    console.log(__dirname);
    fs.mkdirSync("tmp_output", { recursive: true });
    before(async function () {
        circuit = await wasm_tester(
            path.join(__dirname, "circuits", "test_poseidon_committment_4.circom"),
            options
        );
    });

    var test_cases: Array<
        [
            [bigint, bigint],
            [bigint, bigint],
            [bigint, bigint],
            [bigint, bigint],
        ]
    > = [];

    var refpubkeys: Array<PointG1> = [];
    for (var idx = 0; idx < 4; idx++) {
        var pubkey: PointG1 = PointG1.fromPrivateKey(BigInt(private_keys[idx]));
        refpubkeys.push(pubkey);
    }
    test_cases.push([
        point_to_bigint(refpubkeys[0]),
        point_to_bigint(refpubkeys[1]),
        point_to_bigint(refpubkeys[2]),
        point_to_bigint(refpubkeys[3]),
    ]);



    var test_poseidon_committment = function (
        test_case: [
            [bigint, bigint],
            [bigint, bigint],
            [bigint, bigint],
            [bigint, bigint],
        ]
    ) {
        let [pub0x, pub0y] = test_case[0];
        let [pub1x, pub1y] = test_case[1];
        let [pub2x, pub2y] = test_case[2];
        let [pub3x, pub3y] = test_case[3];

        var n: number = 55;
        var k: number = 7;

        let pubkeys = [
            [bigint_to_array(n, k, pub0x), bigint_to_array(n, k, pub0y)],
            [bigint_to_array(n, k, pub1x), bigint_to_array(n, k, pub1y)],
            [bigint_to_array(n, k, pub2x), bigint_to_array(n, k, pub2y)],
            [bigint_to_array(n, k, pub3x), bigint_to_array(n, k, pub3y)],
        ]

        it("poseidon-commitment", async function () {

            let refhash = await poseidon_aggregation(pubkeys.flat().flat());

            let witness = await circuit.calculateWitness({
                pubkeys: pubkeys,
            });
            await circuit.assertOut(witness,
                { out: refhash }
            );
            await circuit.checkConstraints(witness);
        });
    };

    test_cases.forEach(test_poseidon_committment);
})


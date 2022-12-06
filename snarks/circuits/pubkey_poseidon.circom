pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";


/**
 * Computes the Poseidon merkle root of a list of field elements
 * @param  num_eles The number of elements to compute the Poseidon merkle root over
 * @input  in       The input array of size num_eles field elements
 * @output out      The Poseidon merkle root of in
 */
template poseidon_generalized(num_eles) {
    signal input in[num_eles];
    // Can do bytes to field element
    var total_poseidon = (num_eles) \ 15 + 1;
    component poseidon_aggregator[total_poseidon];
    for (var i=0; i < total_poseidon; i++) {
        var poseidonSize = 16;
        if (i == 0) poseidonSize = 15;
        poseidon_aggregator[i] = Poseidon(poseidonSize);
        for (var j = 0; j < 15; j++) {
            if (i*15 + j >= num_eles ) {
                poseidon_aggregator[i].inputs[j] <== 0;
            } else {
                poseidon_aggregator[i].inputs[j] <== in[i*15 + j];
            }
        }
        if (i > 0) {
            poseidon_aggregator[i].inputs[15] <== poseidon_aggregator[i- 1].out;
        }
    }
    signal output out;
    out <== poseidon_aggregator[total_poseidon-1].out;
}

/**
 * Computes the Poseidon merkle root of a list of BLS12-381 public keys
 * @param  b       The size of the set of public keys
 * @param  k       The number of registers
 * @input  pubkeys The input array of size b with BLS12-381 public keys
 * @output out     The Poseidon merkle root of pubkeys
 */
template PubkeyPoseidon(b, k) {
    signal input pubkeys[b][2][k];
    signal output out;

    component poseidonHasher = poseidon_generalized(2*b*k);
    for (var i = 0; i < b; i++) {
            for (var l = 0; l < 2; l++) {
                for (var j = 0; j < k; j++) {
                poseidonHasher.in[i*k*2 + l*k + j] <== pubkeys[i][l][j];
            }
        }
    }
    out <== poseidonHasher.out;
}
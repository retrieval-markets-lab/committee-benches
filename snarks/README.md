# sync-committee circuits

Here we benchmarks the proof generation and verification (using JS+WASM) times for SNARKs built using Circom. 

## Dependencies 

Install Circom as detailed [here](https://docs.circom.io/getting-started/installation/#installing-dependencies). 

To install other dependencies run: 

```bash
npm install 
```

Run 

```bash
npm test 
```

## Current proving time results

**M1Ultra, 64GB of RAM, average of 100 samples**


| n      | Poseidon Commitment         |  Sync Committee (plonk)   | Sync Committee (groth-16)
| -----  | -----------                 |  -----------              |  ----------- |
| 1      | 0 ms                        |  _                        |  _           | 
| 4      | 795 ms                      |  _                        |  869ms       |
| 512    | _ ms                        |  _                        |  _           |

## Current verification time results

TODO


## NOTES: 

Tests do not run unless you delete "type": "module" in the package.json.

scripts do not run unless you add "type": "module" to package.json



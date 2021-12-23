window.BENCHMARK_DATA = {
  "lastUpdate": 1640262174940,
  "repoUrl": "https://github.com/immobiliare/dats",
  "entries": {
    "Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "antoniomusolino007@gmail.com",
            "name": "Antonio Musolino",
            "username": "antoniomuso"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "ae7edf907d64f893fa4b0459dfcdcdcddc353866",
          "message": "Merge pull request #93 from immobiliare/ci/benchmark\n\nchore: added benchmarks",
          "timestamp": "2021-12-23T13:21:28+01:00",
          "tree_id": "3abae32eecda0607be1e69ee859b5e2748e6fda2",
          "url": "https://github.com/immobiliare/dats/commit/ae7edf907d64f893fa4b0459dfcdcdcddc353866"
        },
        "date": 1640262174171,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "dats counter udp base",
            "value": 116590,
            "range": "±1.44%",
            "unit": "ops/sec",
            "extra": "91 samples"
          },
          {
            "name": "dats counter udp buffered",
            "value": 1204929,
            "range": "±1.51%",
            "unit": "ops/sec",
            "extra": "92 samples"
          },
          {
            "name": "dats gauge udp buffered",
            "value": 1218465,
            "range": "±1.59%",
            "unit": "ops/sec",
            "extra": "93 samples"
          },
          {
            "name": "dats set udp buffered",
            "value": 1214069,
            "range": "±1.51%",
            "unit": "ops/sec",
            "extra": "90 samples"
          },
          {
            "name": "dats timing udp buffered",
            "value": 1157342,
            "range": "±1.66%",
            "unit": "ops/sec",
            "extra": "93 samples"
          },
          {
            "name": "dats counter tcp buffered",
            "value": 1953639,
            "range": "±8.29%",
            "unit": "ops/sec",
            "extra": "78 samples"
          }
        ]
      }
    ]
  }
}
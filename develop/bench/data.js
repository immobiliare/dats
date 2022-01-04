window.BENCHMARK_DATA = {
  "lastUpdate": 1641293151983,
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
      },
      {
        "commit": {
          "author": {
            "email": "antoniomusolino007@gmail.com",
            "name": "antoniomuso",
            "username": "antoniomuso"
          },
          "committer": {
            "email": "simonecorsi.dev@gmail.com",
            "name": "Simone Corsi",
            "username": "simonecorsi"
          },
          "distinct": true,
          "id": "3798e33788796c1c55834b05b6e622f27eff8224",
          "message": "docs(README): fixed mailto in docs",
          "timestamp": "2022-01-04T11:44:26+01:00",
          "tree_id": "8733aa02fa9fc4087eb64e455480c33931f03ad6",
          "url": "https://github.com/immobiliare/dats/commit/3798e33788796c1c55834b05b6e622f27eff8224"
        },
        "date": 1641293151534,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "dats counter udp base",
            "value": 103943,
            "range": "±0.66%",
            "unit": "ops/sec",
            "extra": "90 samples"
          },
          {
            "name": "dats counter udp buffered",
            "value": 1026744,
            "range": "±1.53%",
            "unit": "ops/sec",
            "extra": "91 samples"
          },
          {
            "name": "dats gauge udp buffered",
            "value": 1025252,
            "range": "±1.31%",
            "unit": "ops/sec",
            "extra": "94 samples"
          },
          {
            "name": "dats set udp buffered",
            "value": 1024961,
            "range": "±1.19%",
            "unit": "ops/sec",
            "extra": "96 samples"
          },
          {
            "name": "dats timing udp buffered",
            "value": 992303,
            "range": "±1.53%",
            "unit": "ops/sec",
            "extra": "88 samples"
          },
          {
            "name": "dats counter tcp buffered",
            "value": 1718557,
            "range": "±11.59%",
            "unit": "ops/sec",
            "extra": "79 samples"
          }
        ]
      }
    ]
  }
}
window.BENCHMARK_DATA = {
  "lastUpdate": 1643971905227,
  "repoUrl": "https://github.com/immobiliare/dats",
  "entries": {
    "Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "simonecorsi.dev@gmail.com",
            "name": "Simone Corsi",
            "username": "simonecorsi"
          },
          "committer": {
            "email": "simonecorsi.dev@gmail.com",
            "name": "Simone Corsi",
            "username": "simonecorsi"
          },
          "distinct": true,
          "id": "62f699ca1f0672375ee064a5b3e921d39c6c98ff",
          "message": "ci(release): should backmerge correctly",
          "timestamp": "2022-02-04T11:43:32+01:00",
          "tree_id": "200b0102e8b734870c4940a22883afa991bcff3d",
          "url": "https://github.com/immobiliare/dats/commit/62f699ca1f0672375ee064a5b3e921d39c6c98ff"
        },
        "date": 1643971498864,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "dats counter udp base",
            "value": 89790,
            "range": "±1.37%",
            "unit": "ops/sec",
            "extra": "83 samples"
          },
          {
            "name": "dats counter udp buffered",
            "value": 806180,
            "range": "±2.73%",
            "unit": "ops/sec",
            "extra": "82 samples"
          },
          {
            "name": "dats gauge udp buffered",
            "value": 821156,
            "range": "±2.52%",
            "unit": "ops/sec",
            "extra": "83 samples"
          },
          {
            "name": "dats set udp buffered",
            "value": 832573,
            "range": "±2.11%",
            "unit": "ops/sec",
            "extra": "86 samples"
          },
          {
            "name": "dats timing udp buffered",
            "value": 771099,
            "range": "±2.27%",
            "unit": "ops/sec",
            "extra": "84 samples"
          },
          {
            "name": "dats counter tcp buffered",
            "value": 1678431,
            "range": "±7.33%",
            "unit": "ops/sec",
            "extra": "71 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "simonecorsi.dev@gmail.com",
            "name": "Simone Corsi",
            "username": "simonecorsi"
          },
          "committer": {
            "email": "simonecorsi.dev@gmail.com",
            "name": "Simone Corsi",
            "username": "simonecorsi"
          },
          "distinct": true,
          "id": "fbc4425f84c2a527689b84bd984cc921e8b75cea",
          "message": "ci(npm-cache): removed cache",
          "timestamp": "2022-02-04T11:46:37+01:00",
          "tree_id": "49346fc73485a86051e86daa4889d19c9b430d78",
          "url": "https://github.com/immobiliare/dats/commit/fbc4425f84c2a527689b84bd984cc921e8b75cea"
        },
        "date": 1643971904616,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "dats counter udp base",
            "value": 120956,
            "range": "±1.66%",
            "unit": "ops/sec",
            "extra": "85 samples"
          },
          {
            "name": "dats counter udp buffered",
            "value": 944253,
            "range": "±2.24%",
            "unit": "ops/sec",
            "extra": "85 samples"
          },
          {
            "name": "dats gauge udp buffered",
            "value": 980277,
            "range": "±2.28%",
            "unit": "ops/sec",
            "extra": "82 samples"
          },
          {
            "name": "dats set udp buffered",
            "value": 940571,
            "range": "±1.57%",
            "unit": "ops/sec",
            "extra": "91 samples"
          },
          {
            "name": "dats timing udp buffered",
            "value": 903222,
            "range": "±1.85%",
            "unit": "ops/sec",
            "extra": "87 samples"
          },
          {
            "name": "dats counter tcp buffered",
            "value": 1813684,
            "range": "±5.99%",
            "unit": "ops/sec",
            "extra": "77 samples"
          }
        ]
      }
    ]
  }
}
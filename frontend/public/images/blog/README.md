# Blog cover photos

`seed_01.jpg` … `seed_15.jpg` are the cover images the demo blog seeder
assigns to posts — `backend/cmd/seeddummy/main.go` sets each post's
`CoverURL` to `/images/blog/seed_NN.jpg` (and the committed `katherbox.db`
already references them).

These 15 files are copies of botanical photos from
`../products/catalog/` (Wikipedia / Wikimedia Commons, CC-BY-SA / public
domain, centre-cropped 640×640 JPEG). Swap in your own editorial
photography by dropping files with the same names here.

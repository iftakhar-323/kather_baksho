# Catalogue product photos

These 70 images are the real product photography used across the storefront.
Each product's `image_url` is assigned to one of them by
`backend/models/product_image.go` (`ProductImageURL`) — a keyword match on the
product name, falling back to a per-subcategory pool.

## Source & licence

Most files are the lead photo of the matching **Wikipedia / Wikimedia Commons**
article (e.g. `monstera.jpg` ← *Monstera deliciosa*, `pruning-shears.jpg` ←
*Pruning shears*) — accurate, correctly identified, and published under free
licences (CC-BY-SA / public domain). A handful of generic items
(`plant-stand`, `pebble-tray`, `bamboo-tray`, `moss-pole`, `soil-bag`,
`moisture-meter`, `plant-food`, `gift-box-plants`, `plant-collection`) come
from [loremflickr.com](https://loremflickr.com) (Creative Commons Flickr).

All are centre-cropped to 640×640 JPEG. Replace any with your own product
photography by dropping a file with the same name here.

## Regenerating assignments

After adding products (e.g. `go run ./cmd/seedproducts`), refresh every row's
image:

```
cd backend && go run ./cmd/productimages
```

`seedproducts` already sets `image_url` on insert, so this is only needed for
rows created another way or after editing the keyword map.

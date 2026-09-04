# Catalogue product photos

These 70 images are the real product photography used across the storefront.
Each product's `image_url` is assigned to one of them by
`backend/models/product_image.go` (`ProductImageURL`) — a keyword match on the
product name, falling back to a per-subcategory pool.

## Source & licence

Fetched from [loremflickr.com](https://loremflickr.com), which serves photos
from Flickr published under Creative Commons licences. They are placeholders
for a demo catalogue — replace any of them with your own product photography by
dropping a file with the same name here (keep it roughly square, ~640px).

## Regenerating assignments

After adding products (e.g. `go run ./cmd/seedproducts`), refresh every row's
image:

```
cd backend && go run ./cmd/productimages
```

`seedproducts` already sets `image_url` on insert, so this is only needed for
rows created another way or after editing the keyword map.

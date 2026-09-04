package models

import "strings"

// catalogImageDir is the public path (served by the frontend) that holds the
// curated, license-free catalogue photos committed under
// frontend/public/images/products/catalog/.
const catalogImageDir = "/images/products/catalog/"

// nameKeyword maps a substring found in a product name to a catalogue image
// slug. First match wins, so more specific entries come first.
var nameKeyword = []struct{ kw, slug string }{
	// indoor plants
	{"snake plant", "snake-plant"},
	{"zz plant", "zz-plant"},
	{"peace lily", "peace-lily"},
	{"monstera", "monstera"},
	{"rubber plant", "rubber-plant"},
	{"spider plant", "spider-plant"},
	{"anthurium", "anthurium"},
	{"philodendron", "philodendron"},
	{"fiddle leaf", "fiddle-leaf-fig"},
	{"calathea", "calathea"},
	{"areca", "areca-palm"},
	{"money plant", "money-plant"},
	{"aglaonema", "aglaonema"},
	{"maranta", "maranta"},
	{"boston fern", "boston-fern"},
	{"english ivy", "english-ivy"},
	{"lucky bamboo", "lucky-bamboo"},
	{"bromeliad", "bromeliad"},
	{"dieffenbachia", "dieffenbachia"},
	{"bamboo plant", "bamboo-plant"},
	{"pothos", "pothos"},
	// outdoor plants / flowers
	{"rose", "rose"},
	{"hibiscus", "hibiscus"},
	{"jasmine", "jasmine"},
	{"marigold", "marigold"},
	{"bougainvillea", "bougainvillea"},
	{"lantana", "lantana"},
	{"ixora", "ixora"},
	{"plumeria", "plumeria"},
	{"champa", "plumeria"},
	{"tecoma", "tecoma"},
	{"duranta", "duranta"},
	{"poinsettia", "poinsettia"},
	{"petunia", "petunia"},
	{"zinnia", "zinnia"},
	{"cosmos", "cosmos"},
	{"sunflower", "sunflower"},
	{"dahlia", "dahlia"},
	{"tulip", "tulip"},
	{"daffodil", "daffodil"},
	{"lily bulb", "lily"},
	// decor / tools
	{"terracotta", "terracotta-pot"},
	{"stoneware", "ceramic-planter"},
	{"cement pot", "ceramic-planter"},
	{"macram", "macrame-hanger"},
	{"wooden stand", "plant-stand"},
	{"watering can", "watering-can"},
	{"mist sprayer", "mister-spray"},
	{"self-watering globe", "mister-spray"},
	{"plant mister", "mister-spray"},
	{"pebble tray", "pebble-tray"},
	{"moss mat", "moss-pole"},
	{"coir pole", "moss-pole"},
	{"grow light", "grow-light"},
	{"bamboo tray", "bamboo-tray"},
	{"cloche", "glass-cloche"},
	{"trowel", "garden-trowel"},
	{"scoop", "garden-trowel"},
	{"pruning shears", "pruning-shears"},
	{"greenhouse", "greenhouse"},
	// plant boxes
	{"succulent starter box", "succulent-arrangement"},
	{"herb garden box", "herb-garden"},
	{"zen garden box", "terrarium"},
	// care inputs
	{"potting mix", "potting-soil"},
	{"succulent soil", "potting-soil"},
	{"perlite", "perlite"},
	{"vermiculite", "perlite"},
	{"diatomaceous", "perlite"},
	{"neem cake", "fertilizer"},
	{"bone meal", "fertilizer"},
	{"epsom", "fertilizer"},
	{"compost", "compost-bag"},
	{"liquid plant food", "plant-food"},
	{"rooting hormone", "plant-food"},
	{"vitamin tonic", "plant-food"},
	{"neem oil", "neem-oil"},
	{"pruning seal", "spray-bottle"},
	{"fungicide", "spray-bottle"},
	{"insecticidal", "spray-bottle"},
	{"anti-transpirant", "spray-bottle"},
	{"moisture meter", "moisture-meter"},
	{"ph test", "moisture-meter"},
}

// subcategoryPool is the fallback set used when a product name matches no
// keyword. The id picks one deterministically so similar products still vary.
var subcategoryPool = map[string][]string{
	"indoor_plant":  {"monstera", "snake-plant", "pothos", "calathea", "philodendron", "peace-lily", "zz-plant"},
	"outdoor_plant": {"rose", "hibiscus", "marigold", "bougainvillea", "sunflower", "zinnia", "jasmine"},
	"decor":         {"terracotta-pot", "ceramic-planter", "plant-stand", "watering-can", "macrame-hanger", "grow-light"},
	"plant_box":     {"gift-box-plants", "succulent-arrangement", "terrarium", "plant-collection", "herb-garden"},
	"soil":          {"potting-soil", "soil-bag", "compost-bag", "perlite"},
	"fertilizer":    {"fertilizer", "plant-food", "compost-bag"},
	"care_kit":      {"garden-tools", "garden-trowel", "pruning-shears", "moisture-meter", "spray-bottle"},
}

var categoryPool = map[string][]string{
	"plant": {"monstera", "snake-plant", "pothos", "rose", "hibiscus"},
	"decor": {"terracotta-pot", "ceramic-planter", "plant-stand", "watering-can"},
	"care":  {"potting-soil", "fertilizer", "garden-tools", "plant-food"},
}

// ProductImageURL returns the public path of the best-matching catalogue photo
// for a product. It never returns an empty string.
func ProductImageURL(name, subcategory, category string, id uint) string {
	lower := strings.ToLower(name)
	for _, e := range nameKeyword {
		if strings.Contains(lower, e.kw) {
			return catalogImageDir + e.slug + ".jpg"
		}
	}
	if pool := subcategoryPool[subcategory]; len(pool) > 0 {
		return catalogImageDir + pool[int(id)%len(pool)] + ".jpg"
	}
	if pool := categoryPool[category]; len(pool) > 0 {
		return catalogImageDir + pool[int(id)%len(pool)] + ".jpg"
	}
	return catalogImageDir + "plant-collection.jpg"
}

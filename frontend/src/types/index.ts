export interface Plant {
    _id: string;
    name: string;
    category: PlantCategories
}

export enum PlantCategories {
    fruit = "fruit",
    vegetable = "vegetable",
    seeds = "seeds",
    nuts = "nuts",
    grain = "grain",
    herb = "herb",
    spice = "spice",
    beans = "beans",
    legumes = "legumes"
}

export enum CategoryLabels {
    grains = 'Grains',
    nuts_and_seeds = 'Nuts & Seeds',
    beans_and_legumes = 'Beans & Legumes',
    fruit = 'Fruit',
    vegetables = 'Vegetables',
    herbs_and_spices = 'Herbs & Spices'
}

export const categoryLabelMap: {[key in PlantCategories]: CategoryLabels} = {
    [PlantCategories.grain]: CategoryLabels.grains,
    [PlantCategories.nuts]: CategoryLabels.nuts_and_seeds,
    [PlantCategories.seeds]: CategoryLabels.nuts_and_seeds,
    [PlantCategories.beans]: CategoryLabels.beans_and_legumes,
    [PlantCategories.legumes]: CategoryLabels.beans_and_legumes,
    [PlantCategories.fruit]: CategoryLabels.fruit,
    [PlantCategories.vegetable]: CategoryLabels.vegetables,
    [PlantCategories.herb]: CategoryLabels.herbs_and_spices,
    [PlantCategories.spice]: CategoryLabels.herbs_and_spices
  }

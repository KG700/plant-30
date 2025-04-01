export interface Plant {
    _id: string;
    name: string;
    category: string
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
    pulses = "pulses",
    legumes = "legumes"
}

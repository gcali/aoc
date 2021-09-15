import { entryForFile } from "../../entry";
import { buildGroups } from "../../../support/sequences";

interface Ingredient {
    name: string;
    capacity: number;
    durability: number;
    flavor: number;
    texture: number;
    calories: number;
}

const parseIngredients = (lines: string[]): Ingredient[] => {
    return lines.map((line) => {
        const tokens = line.split(" ").map((e) => e.endsWith(":") || e.endsWith(",") ?
            e.slice(0, -1) : e);
        const name = tokens[0];
        const values = [...buildGroups(tokens.slice(1), 2, 2)].map((e) => {
            return {
                type: e[0],
                value: parseInt(e[1], 10)
            };
        });
        const ingredient: Ingredient = {
            name,
            capacity: 0,
            durability: 0,
            flavor: 0,
            texture: 0,
            calories: 0
        };
        for (const t of values) {
            (ingredient as any)[t.type] = t.value;
        }
        return ingredient;

    });
};

function* generateRecipes(ingredients: Ingredient[], total: number): Iterable<Recipe[]> {
    if (ingredients.length === 0) {
        if (total === 0) {
            return;
        }
        throw new Error("Wrong total: " + total);
    }
    if (ingredients.length === 1) {
        yield [{
            amount: total,
            ingredient: ingredients[0]
        }];
        return;
    }
    const [ingredient] = ingredients;
    const otherIngredients = ingredients.slice(1);
    for (let i = 1; i <= total - (ingredients.length - 1); i++) {
        for (const permutation of generateRecipes(otherIngredients, total - i)) {
            yield [{
                ingredient,
                amount: i
            }].concat(permutation);
        }
    }
}

const calculateSingleTotal = (single: Array<{ characteristic: number, amount: number }>): number => {
    return Math.max(0, single.reduce((acc, next) => acc + (next.characteristic * next.amount), 0));
};

interface Recipe { ingredient: Ingredient; amount: number; }

const calculateScore = (recipe: Recipe[]): number => {
    if (recipe.reduce((acc, next) => acc + next.amount, 0) !== 100) {
        throw new Error("Invalid amount");
    }
    const totals = [
        calculateSingleTotal(recipe.map((e) => ({
            characteristic: e.ingredient.capacity,
            amount: e.amount
        }))),
        calculateSingleTotal(recipe.map((e) => ({
            characteristic: e.ingredient.durability,
            amount: e.amount
        }))),
        calculateSingleTotal(recipe.map((e) => ({
            characteristic: e.ingredient.flavor,
            amount: e.amount
        }))),
        calculateSingleTotal(recipe.map((e) => ({
            characteristic: e.ingredient.texture,
            amount: e.amount
        })))
    ];

    return totals.reduce((acc, next) => acc * next, 1);
};

const calculateCalories = (recipe: Recipe[]): number => {
    return recipe.reduce((acc, next) => acc + (next.ingredient.calories * next.amount), 0);
};

export const scienceForHungryPeople = entryForFile(
    async ({ lines, outputCallback }) => {
        const ingredients = parseIngredients(lines);
        let bestResult = Number.NEGATIVE_INFINITY;
        for (const permutation of generateRecipes(ingredients, 100)) {
            const score = calculateScore(permutation);
            bestResult = Math.max(bestResult, score);
        }
        await outputCallback(bestResult);
    },
    async ({ lines, outputCallback }) => {
        const ingredients = parseIngredients(lines);
        const targetCalories = 500;
        let bestResult = Number.NEGATIVE_INFINITY;
        for (const permutation of generateRecipes(ingredients, 100)) {
            if (calculateCalories(permutation) === targetCalories) {
                const score = calculateScore(permutation);
                bestResult = Math.max(bestResult, score);
            }
        }
        await outputCallback(bestResult);
    },
    { key: "science-for-hungry-people", title: "Science for Hungry People", stars: 2, embeddedData: true}
);

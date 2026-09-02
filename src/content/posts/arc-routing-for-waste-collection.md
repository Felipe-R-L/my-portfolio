---
title: Arc Routing for Waste Collection
date: 2026-09-02
summary: Why the solvers you can install optimize a different problem than the one a truck actually has.
tags:
  - optimization
  - vrp
  - carp
  - pyvrp
draft: true
status: draft
synced_at: 2026-09-02T04:47:32.304Z
synced_hash: c99dd48282ca4122485f2bcc2f3cb6845a58021a856aae62c4057d76f7733be3
---

## 1. What is a VRP

Choosing the best route for a fleet of vehicles can have a major impact on a company's operational success. Less distance and time on the road means less wear, maintenance and fuel consumption, which translates directly into financial savings.  
From delivery trucks, to postal workers, waste collection and public transportation. Every domain has specific needs and requirements that make it an NP-Hard problem.  
This set of problems is called Vehicle Routing Problems (VRPs), a complex family of optimization problems which can be divided into two main categories:

### 1.1 Node Routing

Each delivery point is called a node and the goal is to link the nodes in the smallest distance or time, yielding the optimal route for one or more vehicles.  
e.g.: A van delivering packages to various addresses.

### 1.2 Arc Routing

The inverse of node routing, arc routing actually solves for driving through every road in a sector with the least deadhead (overlapping) and distance or time.  
e.g.: A waste collection truck attending every street in a neighborhood.

This article focuses on the second category, which almost always doesn't have a deterministic answer to each case. Instead, heuristic algorithms are used to achieve a "good enough" solution in a given time of execution.

## 2. CARP - The Waste Collection Use Case

To understand why it's NP-Hard it's necessary to analyze the operation of a waste collection truck and how it differs from simply finding the best route from point A to point B like a mobile GPS does. First, going from A to B has no bounds or sector constraints, the solver is free to choose the shortest absolute path. On the other hand, waste collection is usually done by sectors or neighborhoods, and the truck fills up with waste, meaning it may not be able to complete its route without making a roundtrip to a landfill to unload. This imposes some hardships on the modeling, as bad sectoring can lead to unnecessary roundtrips and more deadhead or maneuvering to stay in bounds. It drastically influences efficiency of the generated routes.

On top of that, considering external factors is also crucial, a truck is not able to go through narrow roads or make very sharp turns, so the modeling must account for that. Traffic can increase idle time severely and some regions can produce more waste than others which makes it difficult to predict how many roundtrips the truck will need to do in order to complete the sector. As a result it is nearly impossible to account for all the factors and find an "absolute best" solution.

## 3. The Solver Algorithms

There are several algorithms used to solve VRPs, and a simple thought experiment makes the difference between them visible. Imagine a prom where every guest has to find a pair, and the goal is for the distance walked by everyone in the room to add up to the smallest possible number, the same way a fleet of trucks has to deliver every package while driving the least total distance.

### 3.1 Local Search

This is the simplest algorithm, it uses a matrix of distances to find nearby nodes or arcs and build a solution, optimizing by the lowest distance step by step. Its drawback is that choosing the closest neighbor might make the next path worse or longer.  
Going back to the thought experiment: choosing your closest neighbor could force a more distant guest to walk the entire room, while you could simply take a few steps and find a pair.

### 3.2 Iterated Local Search

Similar to the first algorithm, ILS starts with a couple of seeds and then breaks parts of the route on purpose to further optimize it.  
This solves the problem of regular local search, as shaking the solution can get rid of plateaus and yield better final solutions. Imagine breaking apart some pairs of guests so they can find a better match, even if one of them has to walk a longer way, the overall distance might compensate for it.  
The number of seeds and time budget is tweakable and might improve the final quality of the routes.

### 3.3 Hybrid Genetic Search

Starting off with an initial population of solutions and evolving from it. By swapping parts between elite solutions and creating new ones, polishing them with local search then adding them back to the pool, this process is repeated over and over again and the worst solutions are discarded.  
This is harder to put in comparison with the thought experiment. Execution time and population also can be tweaked to improve results.

## 4. Adapting a Node Routing Solver to CARP

For a node routing solver to work on a CARP, we must invert the modeling of the problem itself. The trick is to turn each road to be attended into a node and generate a distance matrix between the start of a road and the next. This allows the solver to perform local searches, which enables most of the other algorithms.

In order to add turn penalties we must create an extended matrix, one that carries more than the distance between two arcs. The solver of choice, PyVRP, only accepts penalties for load, time window and distance, so every other rule of the operation had to be encoded into the cost itself. A U-turn beyond a certain angle carries an arbitrary extra distance that does not exist anywhere on the map, a sharp turn carries a smaller one, left turn carries its own cost in right-hand traffic, and a hop between two arcs that don't connect carries a penalty of its own. A maneuver that is simply illegal gets a cost so large the solver treats it as a prohibition. None of these are real distances, they are operational rules modeled into the only language the solver understands, and the specific values are calibration, particular to the fleet and to the city where the system will run.

The speed used to convert distance into duration has to describe the operation and not the road. A truck collecting, with the crew loading and stopping every few meters, spends most of the route stopped or at low speed, so the collection speed is fixed at a conservative value way below the street limit, until the telemetry data is available and allows calibrating it properly.

I also evaluated the Hybrid Genetic Search implementation by Thibaut Vidal, which is the academically stronger fit for this problem, and chose not to adopt it. The reason was maintenance and stack coherence, since it's written in C++ and nobody on the team can read or extend it, it is a liability regardless of how well it performs on a benchmark.

## 5. Cracking Two-Way Streets

One-way streets are a simple case, as there is nothing to decide, the direction is already fixed. The real and internal costs are the same number. On a two-way street the matrix carries a duplicate of every road, since the truck can cross it from either end, and that is where the two numbers come apart. A pair of roads can only be joined at one end, but the solver never sees that restriction, so it is free to price one link assuming a road is crossed in one direction and the next link assuming the same road is crossed in the other. The total it reports is a floor the real route can never achieve.

Going back to the prom, a road behaves like a pair already holding hands rather than like a single guest, and the truck (say, another person) joins them by taking the free hand at one end and leaves from the free hand at the other. Which end to take is a single decision that is paid twice, once on the walk in and once on the walk out, and the matrix prices every link as if the pair could turn itself around in between.

The way around this is a two step approach that splits the time budget in half:
1. The first half runs the instance as it stands, and the only thing kept from it is the direction each road ended up being crossed in, which means all directions are locked.
2. The second half feeds the same instance back into the solver with those locked directions, which turns it into a one-way problem, so the solver optimizes freely again and the internal cost it minimizes is the same as the real one. This approach also prevents artifacts from getting into the routes and making them illegal.

## 6. Tweaking for Absolute Performance

The modeling above makes the problem solvable. The solution is not necessarily good. Measured on the 34 `egl` instances, the standard academic benchmark for CARP, the first working version averaged 2.33% delta over the best known solutions. Three changes in execution brought that down to a whopping 0.17%.

The first was running fifteen seeds in parallel instead of only one. The solver is stochastic and stops by wall clock rather than by convergence, which means by 30s it stops no matter how bad the route turned out, so a single seed is a lottery ticket. Seed 0 was not the best one in 30 of the 34 instances.

The second was selecting among those seeds by the real cost of the route rather than by the solver's internal goal. This choice happens at the end of the first half, while the directions are still free and the two numbers still diverge, so every candidate has its directions resolved only to be priced, and the seed that wins is the one that is cheapest once that price is known. The internal number is the optimistic floor of the section above, so ordering seeds by it orders them by the wrong quantity, which showed up plainly in one of the instances where the seed with the lowest internal cost produced the third worst real cost.

The third was the reorientation pass itself, which costs half of the time budget and buys the difference between minimizing the optimistic number and minimizing the one the truck actually drives. Once the second half ends the two numbers agree, and all that is left is deciding whether it actually beat the route the first half had already found, a comparison only the real cost can make, since the internal numbers of the two halves are not measuring the same thing.

The result averages 0.17% over the best known solutions, ahead of the 0.63% published by Hexaly, a paid commercial solver, in the same wall clock budget, and ahead of it in 15 of the 34 instances.

> [!warning] Three caveats belong next to that number
> The budget that is equal on both sides is the elapsed time of 60s and not processor time, because the fifteen seeds run on fifteen cores at once, so reproducing the same number on a single core machine would take fifteen times the wait. Hexaly enters the comparison only through self-published results against a reference it did not disclose, and the reproducible baseline here is OR-Tools. The `egl` instances are two-way streets, which is where the whole direction problem lives, and the gain from the reorientation pass is much smaller on a one-way grid as explained earlier.

## 7. Conclusion

The hardest part of this work was recognizing that the open source solvers available optimize a different problem than the one a collection truck actually has. Once the graph is inverted the machinery is already built and battle tested by people far better at optimization than I am, and what remains is deciding which rules of the real operation get written into the cost matrix and how the execution budget is spent.

My opinion is that this is where most of the value in applied optimization sits. The algorithms are published, benchmarked and available in libraries anyone can install in a minute, and what separates a route a driver will actually follow from a route that only looks good on a benchmark is how faithfully the constraints of the operation were encoded into the model.

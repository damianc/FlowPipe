# FlowPipe

FlowPipe works somewhat like the pipeline operator `|>`.
To make a value flowable, call `flow()` passing the value as the first argument. Then, to indicate a value being processed, use `flow.$` as an argument of `pipe()` method. Final value can be accessed by the call of `get()`.

```
function uppercase(str) {
	return str.toUpperCase();
}

var str = flow('john').pipe(uppercase).pipe(flow.$ + '!');
console.log(str.get());    // JOHN!
```

## `pipe()` method

The method can take following combinations of arguments:

* *(expression)* - modifies the current value, for example, concatenates strings
* *(function)* - calls a function and passes to this function the current value as a first argument
* *(function, extraArg1, ..., extraArgN)* - similar to the previous + passes extra arguments to the function
* *(function, callSpec)* - *callSpec* is a object that can have *this*, *args* or both properties to define a context for the function call and an array of the arguments to pass (the current value can be passed by *flow.$*)
* *(..., flow.$orig)* - to any of the above, *flow.$orig* can be passed as a last argument to return the processed value instead of a result of an operation on it
* *(..., flow.$both)* - similar to *flow.$orig*, but returns an array containing both modified and original value

Let's take a look at a couple of examples:

### processing a number

```
var num = flow(-3)
	.pipe(flow.$ + 1)
	// -2
	.pipe(Math.abs)
	// 2
	.pipe(Math.pow, 2)
	// 4
	.pipe(
		Math.pow, {
			args: [2, flow.$]
		}
	);
	// 16

console.log(num.get());
// 256
```

### processing an array

```
var arr = flow(['a', 'b', 'c', 'd'])
	.pipe(
		Array.prototype.pop,
		{ this: flow.$ },
		flow.$orig
	)
	.pipe(
		Array.prototype.reverse,
		{ this: flow.$ }
	);

console.log(arr.get());
// ['c', 'b', 'a']
```

Here, if we would not use `flow.$orig`, we would get the value `d`. It is because `pop()` method returns a deleted item of an array. We want to get the original value passed to `pipe()` (after it has been processed).

### processing an object

```
var obj = flow({a: 1})
	.pipe(
		Object.assign,
		{ b: 2}
	)
	.pipe(
		delete flow.$.a,
		flow.$orig
	);

console.log(obj.get());
// {b: 2}
```

`flow.$orig` has been used because of the same reason as in the case of the above array - `delete` operator returns `true`, but we want to process the original value, i.e., the object.

## Throwing an exception when processing

Let's throw error if a first letter does not equal A.
In the first example everything is ok:

```
var res = flow('ABC')
	.pipe((_) => {
		if (_.charAt(0) != 'A') throw new Error('Wrong first letter');
	}, flow.$orig)
	.get();
// res = 'ABC'
```

When it comes to the other, it can't be said so:

```
var res = flow('CBA')
	.pipe((_) => {
		if (_.charAt(0) != 'A') throw new Error('Wrong first letter');
	}, flow.$orig)
	.get();
// res = 'ABC'
// + error thrown
```

## Passing the promises

Promises can be passed to `pipe()` with `await` keyword.

```
flow('/api/url')
	.pipe(await $.ajax({
		url: flow.$,
		data: someData
	}))
	.pipe(flow.$ + 1)
	.pipe(new Item(flow.$))
	.pipe(flow.$.id)
	.get();
```

```
flow(promise)
	.pipe(await flow.$)
	.pipe(flow.$.id + ': ' + flow.$.name)
	.get();
```

## Getting both original and modified value

In the examples above, we have used `$.orig` to get the original value rather than the processed one. We may want to get both. Then, the last argument of `pipe()` method should be `$.both`. What will be returned is an array `[modifiedValue, originalValue]`.

```
var res = flow([1, 2, 3])
	.pipe(
		Array.prototype.reduce,
		{
			this: flow.$,
			args: [
				(a, b) => a + b,
				0
			]
		},
		flow.$both
	)
	.pipe({
		items: flow.$[1],
		sum: flow.$[0]
	})
	.get();

console.log(res);
// {items: [1, 2, 3], sum: 6}
```

{
const f = (a, b) => {
	if(!Array.isArray(a)) a = [a]
   	if(!Array.isArray(b)) b = [b]
	return [].concat(...a.map(d => b.map(e => [].concat(d, e))));
}
const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);
}

LanguageModel = Expression

//Expression = head:MultiExpression _ tail:Expression* {return [head, tail.flat()].flat()}
Expression = head:MultiExpression _ tail:Expression* {
if(!Array.isArray(head)) head = [].concat(head)
if(!Array.isArray(tail)) tail = [].concat(tail)
	
return cartesian(...head, ...tail)
}

MultiExpression =  _ head:MultiWordExpression {return [head]}
/ Word 
/ Slot


MultiWordExpression = "(" wordArray:WordArray ")" {return [].concat(wordArray)}
/ "("_"|" wordArray:WordArray ")" {return [].concat(" ", wordArray)}

WordArray = head:Word _ "|"+ _ tail:WordArray* {return [].concat(head, ...tail)}
/ head:Word _ tail:WordArray* {return head + " "+ tail}

//TypeArray = "{" typeName:Word "}" {return {typeName}}

Slot = "{" customSlot:Word "}" {return `{${customSlot}}`}

_ "whitespace"
= [ \t\n\r]*

Word
= _ word:$([A-Za-z0-9 \' \? \! \ü \ö \ä \ß])+ _ { return word; }
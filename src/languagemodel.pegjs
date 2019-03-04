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

WordArray = 
  head:Word _ "|" _ tail:WordArray* {return [].concat(head, ...tail)}
/ head:Slot _ "|" _ tail:WordArray* {return [].concat(head, ...tail)}
/ head:Slot "|" tail:WordArray* {return [].concat(head, ...tail)}
/ head:Word _ tail:WordArray*  {return head + " " + tail}
/ head:Slot _ tail:WordArray* {return head + " " + tail}




//TypeArray = "{" typeName:Word "}" {return {typeName}}

Slot = _ customSlot:$(_"{" Word "}"_)+ {return `${customSlot} `;}

_ "whitespace"
= [ \t\n\r]*

Word
= _ word:$(
	[\u0020-\u0027] // https://unicode-table.com/de/blocks/basic-latin/ exclude '(' and ')'
    /
	[\u002a-\u007a] // https://unicode-table.com/de/blocks/basic-latin/ exclude '{','|' and '}'
    /
    [\u00a1-\u00ff] //https://unicode-table.com/de/blocks/latin-1-supplement/
    /
    [\u0100-\u017f] //https://unicode-table.com/de/blocks/latin-extended-a/
    /
    [\u0180-\u024f] //https://unicode-table.com/de/blocks/latin-extended-b/
    /
    [\u4e00-\u9fbf] //https://en.wikipedia.org/wiki/Japanese_writing_system Kanji
    /
    [\u3040-\u309F] //https://en.wikipedia.org/wiki/Japanese_writing_system Hiragana
    /
    [\u30A0-\u30FF] //https://en.wikipedia.org/wiki/Japanese_writing_system Katakana
    )+ _ { return word; }
# Cosense ChatGPT Walker

![v](https://badgen.net/npm/v/cosense-chatgpt-walker)
![license](https://badgen.net/github/license/kawakamimoeki/cosense-chatgpt-walker)
![download](https://badgen.net/npm/dw/cosense-chatgpt-walker)

A command-line tool for walking in Cosense(Scrapbox) with ChatGPT.

## Usage

### CLI

```
export OPENAI_API_KEY=your-openai-api-key
```

```bash
npx cosense-chatgpt-walker your-cosense-project-name
```

```
> アランケイがしたことは
Query: アランケイ
Search results:
* アラン・ケイ
* 未来を予測する最善の方法は、それを発明することだ
* 車輪の再発明
* Dynabook構想
* 時計とPC
* キーボードを打ちながら考えてる
* スマホはUXが悪い
* おもしろいiPhoneの名前
---
アランケイがしたことは、計算機科学者や教育者、ジャズ演奏家として活動していました。彼は未来を予測する最善の方法は、それを発明することだという考えを持ち、その理念を実現すべくDynabook構想を提唱しました。この構想は、すべての年齢の子供たちのためのパーソナルコンピューターを提案しており、iPhoneやiPadの登場によって実現が遠のいてしまっていると感じています。彼は車輪の再発明という概念にも共感し、すでにある技術を自ら再び作り上げることに意味を見出しています。また、時計とPCやキーボードを打ちながら考えてるという独自の視点も持っており、スマホのUXが悪いという意見も述べています。アランケイは独自の考え方や発想を持ち合わせており、先進的な技術や概念を通して未来を切り拓くことに貢献して...
```

#### Reset cache

```bash
npx cosense-chatgpt-walker your-cosense-project-name --no-cache
```

### Typescript

```typescript
const messages = new Array<any>();
const exploredPages = new Array<CosensePage>();
const queries = [];
const data = await fetchCosense(projectName);
const { query, pages } = await walk(
  "アランケイがしたことは",
  data,
  queries,
  exploredPages
);
const res = await askChatGPT(question, pages, messages);
console.log(res);
```

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/kawakamimoeki/cosense-chatgpt-walker. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [code of conduct](https://github.com/kawakamimoeki/cosense-chatgpt-walker/blob/main/CODE_OF_CONDUCT.md).

## License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

## Code of Conduct

Everyone interacting in the Cosense ChatGPT Walker project's codebases, issue trackers, chat rooms and mailing lists is expected to follow the [code of conduct](https://github.com/kawakamimoeki/cosense-chatgpt-walker/blob/main/CODE_OF_CONDUCT.md).

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Head>
      <title>Matrix Playground</title>
      <meta name="description" content="A website to play with matrix operations in any dimension" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      <meta name="keywords" content="matrix, math, linear algebra, matrix operations, matrix calculator, matrix playground" />
      <link rel="icon" href="/logo.png" />

    </Head>
    <Component {...pageProps} />
  </>;
}

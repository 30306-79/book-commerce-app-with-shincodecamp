import Book from "./components/Book";
import { getAllBooks } from "./lib/microcms/client";
import { BookType } from "./types/types";

export default async function Home() {
  const result: any = await getAllBooks();
  // console.log(result);
  const contents = Array.isArray(result?.contents) ? result.contents : [];
  const error = result?.error as string | undefined;

  return (
    <main className="flex flex-wrap justify-center items-center md:mt-32 mt-20">
      <h2 className="text-center w-full font-bold text-3xl mb-2">
        Book Commerce
      </h2>
      {error && (
        <p className="w-full text-center text-red-600">
          データを取得できませんでした（{error}）
        </p>
      )}
      {contents.map((b: BookType) => (
        <Book key={b.id} book={b} />
      ))}
    </main>
  );
}

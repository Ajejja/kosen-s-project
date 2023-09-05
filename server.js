// Corrected URLs with versions
import { serve } from "https://deno.land/std@0.194.0/http/server.ts?s=serve";
import { serveDir } from "https://deno.land/std@0.194.0/http/file_server.ts?s=serveDir";
import { Client } from "https://deno.land/x/mysql@v2.11.0/mod.ts";
import "https://deno.land/std@0.193.0/dotenv/load.ts";
const mySqlClient = await new Client().connect({
  hostname: Deno.env.get("MYSQL_HOSTNAME"),
  username: Deno.env.get("MYSQL_USER"),
  password: Deno.env.get("MYSQL_PASSWORD"),
  db: Deno.env.get("DATABASE"),
});

serve(async (req) => {
  const pathname = new URL(req.url).pathname;
  console.log(pathname);

  if (req.method === "GET" && pathname === "/welcome-message") {
    return new Response("jig.jpインターンへようこそ！👍");
  }

  if (req.method === "POST" && pathname === "/dreams") {
    const reqJson = await req.json();
    const contents = reqJson.contents;
    if (contents === "") {
      return new Response("空文字です。");
    } else {
      return new Response("空文字ではありません。");
    }
  }
  // New endpoint for fetching dreams
  if (req.method === "GET" && pathname === "/dreams") {
    const dreams = await mySqlClient.query(
      "SELECT * FROM dreams ORDER BY timestamp DESC LIMIT 50"
    );
    return new Response(JSON.stringify(dreams));
  }

  if (req.method === "GET" && pathname.startsWith("/dreams/paginated")) {
    const params = new URLSearchParams(new URL(req.url).search);
    const page = parseInt(params.get("page") || "1");
    const limit = parseInt(params.get("limit") || "10");
    const offset = (page - 1) * limit;

    const dreams = await mySqlClient.query(
      "SELECT * FROM dreams ORDER BY timestamp DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const filteredDreams = dreams.map((dream) => ({
      dream_content: dream.dream_content,
      timestamp: dream.timestamp,
    }));
    return new Response(JSON.stringify(filteredDreams));
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});

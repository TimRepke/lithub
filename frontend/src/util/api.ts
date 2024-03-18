import { useApiStore } from "../stores/apistore.ts";
import { isArray } from "@/util/index.ts";

export const API_BASE = import.meta.env.VITE_LITHUB_API_URL;
export const DATA_BASE = import.meta.env.VITE_LITHUB_DATA_URL;

export function d2s(d: Date) {
  return `${d.getFullYear()}-${("0000" + (d.getMonth() + 1)).slice(-2)}-${("0000" + d.getDate()).slice(-2)}`;
  //return d.toISOString().split('T')[0]; // nicer, but timezone issues
}

export type URLParams = Record<string, string | number | string[] | number[]>;

export function getUrl(path: string, params: URLParams | null = null) {
  let url = path.startsWith("http") ? path : API_BASE + path;
  if (params) {
    url +=
      "?" +
      Object.entries(params)
        .flatMap(([key, values]) => {
          if (isArray<string | number>(values)) return values.map((value) => `${key}=${encodeURIComponent(value)}`);
          return [`${key}=${encodeURIComponent(values)}`];
        })
        .join("&");
  }
  return url;
}

export function request(params: {
  method: string;
  path: string;
  params?: URLParams | null;
  headers?: HeadersInit;
  body?: BodyInit | null;
}): Promise<Response> {
  const apiStore = useApiStore();
  const req = apiStore.startRequest();
  const url = getUrl(params.path, params.params);
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: params.method,
      mode: "cors",
      headers: params.headers,
      body: params.body,
    })
      .then((response) => {
        apiStore.finishRequest(req);
        resolve(response);
      })
      .catch((reason) => reject(reason));
  });
}

export async function GET<T>(params: { path: string; params?: URLParams; headers?: HeadersInit }): Promise<T> {
  const response = await request({ method: "GET", path: params.path, params: params.params, headers: params.headers });
  return response.json();
}

export async function DELETE<T>(params: { path: string; params?: URLParams; headers?: HeadersInit }): Promise<T> {
  const response = await request({
    method: "DELETE",
    path: params.path,
    params: params.params,
    headers: params.headers,
  });
  return response.json();
}

export async function POST<T>(params: {
  path: string;
  params?: URLParams;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
  headers?: HeadersInit;
}): Promise<T> {
  const response = await request({
    method: "POST",
    body: JSON.stringify(params.payload),
    path: params.path,
    params: params.params,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...params.headers,
    },
  });
  return response.json();
}

export function GETWithProgress(params: {
  path: string;
  progressCallback: (bytesLoaded: number) => void;
  params?: URLParams;
  headers?: HeadersInit;
}): Promise<ArrayBuffer> {
  const apiStore = useApiStore();
  const req = apiStore.startRequest();
  const url = getUrl(params.path, params.params);
  let loaded = 0;
  return new Promise((resolve, reject) => {
    // mostly copied from
    // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream#fetch_stream
    fetch(url, {
      method: "GET",
      mode: "cors",
      headers: params.headers,
    })
      .then((response) => response.body)
      .then((rb) => {
        if (!rb) throw Error("Empty response, this should've never happened");
        const reader = rb.getReader();

        return new ReadableStream({
          start(controller) {
            // The following function handles each data chunk
            function push() {
              // "done" is a Boolean and value a "Uint8Array"
              reader.read().then(({ done, value }) => {
                // If there is no more data to read
                if (done) {
                  // console.log("done", done);
                  controller.close();
                  return;
                }
                // Get the data and send it to the browser via the controller
                controller.enqueue(value);
                // Check chunks by logging to the console
                //console.log(done, value);
                loaded += value.length;
                params.progressCallback(loaded);
                push();
              });
            }

            push();
          },
        });
      })
      .then(
        (stream) =>
          // Respond with our stream
          new Response(stream, { headers: { "Content-Type": "application/vnd.apache.arrow.file" } }),
      )
      .then(async (result) => {
        apiStore.finishRequest(req);
        resolve(await result.arrayBuffer());
      })
      .catch(reject);
  });
}

import { OpenAPIV3 } from 'openapi-types';

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function fetchOpenAPISpec(url: string): Promise<OpenAPIV3.Document> {
  try {
    if (!url) {
      throw new Error('Please provide a FastAPI server URL');
    }

    if (!isValidUrl(url)) {
      throw new Error('Please provide a valid URL (e.g., http://localhost:8000)');
    }

    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const response = await fetch(`${cleanUrl}/openapi.json`, {
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('OpenAPI specification not found. Please check if this is a FastAPI server and the URL is correct.');
      }
      if (response.status === 0 || !response.status) {
        throw new Error('Cannot connect to the server. Please check:\n1. The server is running\n2. CORS is enabled\n3. The URL is correct');
      }
      throw new Error(`Server error (${response.status}). Please check if the FastAPI server is running correctly.`);
    }
    
    const data = await response.json();
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid OpenAPI specification received. Please check if the server is a FastAPI server.');
    }
    
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to the server. Please check:\n1. The server is running\n2. The URL is correct (e.g., http://localhost:8000)\n3. Your network connection');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch OpenAPI specification');
  }
}

export async function callEndpoint(url: string, method: string, path: string, data?: any) {
  try {
    if (!url) {
      throw new Error('Please provide a FastAPI server URL');
    }

    if (!isValidUrl(url)) {
      throw new Error('Please provide a valid URL (e.g., http://localhost:8000)');
    }

    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const response = await fetch(`${cleanUrl}${path}`, {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json().catch(() => null);
    
    return {
      status: response.status,
      data: responseData,
      ok: response.ok,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        status: 500,
        data: { detail: 'Cannot connect to the server. Please check:\n1. The server is running\n2. The URL is correct\n3. Your network connection' },
        ok: false,
      };
    }
    if (error instanceof Error) {
      return {
        status: 500,
        data: { detail: error.message },
        ok: false,
      };
    }
    return {
      status: 500,
      data: { detail: 'An unknown error occurred' },
      ok: false,
    };
  }
}

export function getSchemaFromPath(
  spec: OpenAPIV3.Document,
  path: string,
  method: string
): OpenAPIV3.SchemaObject | null {
  const pathObj = spec.paths[path];
  if (!pathObj) return null;

  const operation = pathObj[method.toLowerCase() as keyof OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject;
  if (!operation) return null;

  const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
  if (!requestBody) return null;

  const content = requestBody.content['application/json'];
  if (!content) return null;

  let schema = content.schema as OpenAPIV3.SchemaObject;
  
  // Resolve schema reference if it exists
  if (schema.$ref) {
    schema = resolveSchemaRef(spec, schema.$ref);
  }

  return schema;
}

export function resolveSchemaRef(spec: OpenAPIV3.Document, ref: string): OpenAPIV3.SchemaObject {
  const parts = ref.split('/');
  let current: any = spec;
  
  // Skip the first empty part and #
  for (let i = 1; i < parts.length; i++) {
    current = current[parts[i]];
    if (!current) {
      throw new Error(`Could not resolve schema reference: ${ref}`);
    }
  }
  
  return current as OpenAPIV3.SchemaObject;
}
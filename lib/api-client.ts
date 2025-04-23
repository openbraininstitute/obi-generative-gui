import { OpenAPIV3 } from 'openapi-types';

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Implement retry logic with exponential backoff
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export async function fetchOpenAPISpec(url: string): Promise<OpenAPIV3.Document> {
  try {
    if (!url) {
      throw new Error('Please provide a FastAPI server URL');
    }

    if (!isValidUrl(url)) {
      throw new Error('Please provide a valid URL (e.g., http://localhost:8100)');
    }

    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    
    console.log('\n=== Fetching OpenAPI Spec ===');
    console.log('URL:', `${cleanUrl}/openapi.json`);
    
    const response = await fetchWithRetry(`${cleanUrl}/openapi.json`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAPI Spec Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      if (response.status === 404) {
        throw new Error('OpenAPI specification not found. Please check if this is a FastAPI server and the URL is correct.');
      }
      if (response.status === 0 || !response.status) {
        throw new Error('Cannot connect to the server. Please check:\n1. The server is running\n2. CORS is enabled\n3. The URL is correct');
      }
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid OpenAPI specification received. Please check if the server is a FastAPI server.');
    }
    
    console.log('OpenAPI Spec fetched successfully');
    return data;
  } catch (error) {
    console.error('Error fetching OpenAPI spec:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to the server. Please check:\n1. The server is running\n2. The URL is correct (e.g., http://localhost:8100)\n3. Your network connection');
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
      throw new Error('Please provide a valid URL (e.g., http://localhost:8100)');
    }

    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const fullUrl = `${cleanUrl}${path}`;
    
    console.log('\n=== API Request ===');
    console.log('URL:', fullUrl);
    console.log('Method:', method.toUpperCase());
    console.log('Request Body:', JSON.stringify(data, null, 2));
    console.log('================\n');
    
    const response = await fetchWithRetry(fullUrl, {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined
    });

    let responseData;
    try {
      const textResponse = await response.text();
      console.log('\n=== API Response ===');
      console.log('Status:', response.status);
      console.log('Response Body:', textResponse);
      console.log('=================\n');
      
      responseData = textResponse ? JSON.parse(textResponse) : null;
    } catch (e) {
      console.error('Error parsing response:', e);
      responseData = { detail: 'Invalid JSON response from server' };
    }

    if (!response.ok) {
      return {
        status: response.status,
        data: responseData || { detail: `Server error: ${response.statusText}` },
        ok: false,
      };
    }

    return {
      status: response.status,
      data: responseData,
      ok: true,
    };
  } catch (error) {
    console.error('API call error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        status: 500,
        data: { 
          detail: 'Cannot connect to the server. Please check:\n1. The server is running\n2. CORS is enabled\n3. The URL is correct'
        },
        ok: false,
      };
    }
    
    return {
      status: 500,
      data: { 
        detail: error instanceof Error ? error.message : 'An unknown error occurred'
      },
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
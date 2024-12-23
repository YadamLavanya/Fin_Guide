'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { parse } from 'yaml';
import { useEffect, useState } from 'react';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    fetch('/api-docs/openapi.yaml')
      .then((res) => res.text())
      .then((text) => {
        const parsedSpec = parse(text);
        setSpec(parsedSpec);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">CurioPay API Documentation</h1>
      {spec && <SwaggerUI spec={spec} />}
    </div>
  );
} 
import { useEffect } from 'react';

interface UseSeoMetadataProps {
    title: string;
    description: string;
    canonicalPath: string;
    schemaData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export const useSeoMetadata = ({
    title,
    description,
    canonicalPath,
    schemaData
}: UseSeoMetadataProps) => {
    // Dynamic SEO Metadata Injection
    useEffect(() => {
        document.title = title;

        // Meta Description update/creation
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', description);

        // Canonical URL update/creation
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        const fullUrl = `https://www.preptodo.in${canonicalPath}`;
        canonicalLink.setAttribute('href', fullUrl);

        // Standard clean up is not strictly necessary for title/description,
        // but we keep them for the lifecycle duration.
    }, [title, description, canonicalPath]);

    // Dynamic JSON-LD Schema Injection
    useEffect(() => {
        if (!schemaData) return;

        const schemaId = `jsonld-schema-${canonicalPath.replace(/\//g, '-')}`;
        let script = document.getElementById(schemaId) as HTMLScriptElement | null;
        
        if (!script) {
            script = document.createElement('script');
            script.id = schemaId;
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }

        script.textContent = JSON.stringify(schemaData);

        return () => {
            if (script) {
                script.remove();
            }
        };
    }, [schemaData, canonicalPath]);
};

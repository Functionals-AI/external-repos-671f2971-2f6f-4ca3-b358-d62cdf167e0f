import { PlasmicComponent } from "@plasmicapp/loader-nextjs";
import { notFound } from "next/navigation";
import { PLASMIC } from "@/plasmic-init";
import { ClientPlasmicRootProvider } from "@/plasmic-init-client";
import { PlasmicErrorBoundary } from "@/app/components/PlasmicErrorBoundary";
import type { Metadata, ResolvingMetadata } from 'next'

// Increase revalidation time to reduce frequency of updates
export const revalidate = 300; // 5 minutes

export async function generateMetadata ({ params }: { params?: { catchall: string[] | undefined } }, parent: ResolvingMetadata): Promise<Metadata|undefined> {
  const defaultTitle = 'Foodsmart | Personalized Telehealth Nutrition Solution'
  const defaultDescription = `With the largest national network of registered dietitians, we've helped over 1.5 million members improve their health with personalized nutrition guidance from the comfort of their own home.`
  const defaultImages = ['https://img.plasmic.app/img-optimizer/v1/img/ccb128a5e2bc70b4467424866fd82c99.jpg'];
  const resolvedParent = await parent;
  const plasmicComponentData = await fetchPlasmicComponentData(params?.catchall);
  const { title, description, openGraph } = resolvedParent;
  const fallbackOpenGraph = {
    title: openGraph?.title,
    description: openGraph?.description,
    images: openGraph?.images
  };
  const fallback: Metadata = { title, description, openGraph: fallbackOpenGraph };

  if (!plasmicComponentData) return fallback;

  const { prefetchedData } = plasmicComponentData;

  if (!prefetchedData.entryCompMetas.length) return fallback;
  if (!prefetchedData.entryCompMetas[0]?.pageMetadata) return fallback;

  const pageMetadata = prefetchedData.entryCompMetas[0]?.pageMetadata

  return {
    title: pageMetadata.title || defaultTitle,
    description: pageMetadata.description || defaultDescription,
    metadataBase: new URL('https://foodsmart.com'),
    openGraph: {
      title: pageMetadata.title || defaultTitle,
      description: pageMetadata.description || defaultDescription,
      images: pageMetadata.openGraphImageUrl ? [pageMetadata.openGraphImageUrl] : defaultImages
    }
  }
}

export default async function PlasmicLoaderPage({
  params,
}: {
  params?: { catchall: string[] | undefined };
}) {
  const plasmicComponentData = await fetchPlasmicComponentData(params?.catchall);
  if (!plasmicComponentData) {
    notFound();
  }

  const { prefetchedData } = plasmicComponentData;
  if (prefetchedData.entryCompMetas.length === 0) {
    notFound();
  }

  const pageMeta = prefetchedData.entryCompMetas[0];
  return (
    <ClientPlasmicRootProvider
      prefetchedData={prefetchedData}
      pageParams={pageMeta.params}
      pageQuery={{}}
    >
      <PlasmicErrorBoundary
        component={pageMeta.displayName}
        prefetchedData={prefetchedData}
        pageParams={pageMeta.params}
        pageQuery={{}}
      />
    </ClientPlasmicRootProvider>
  );
}

async function fetchPlasmicComponentData(catchall: string[] | undefined) {
  const plasmicPath = "/" + (catchall ? catchall.join("/") : "");
  
  // Add retry logic for fetching component data
  let retries = 3;
  let lastError;
  
  while (retries > 0) {
    try {
      const prefetchedData = await PLASMIC.maybeFetchComponentData(plasmicPath);
      if (prefetchedData) {
        return { prefetchedData };
      }
    } catch (error) {
      lastError = error;
      console.warn(`Failed to fetch Plasmic data, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
    }
    retries--;
  }
  
  if (lastError) {
    console.error('Failed to fetch Plasmic data after retries:', lastError);
  }
  
  return null;
}

export async function generateStaticParams() {
  const pageModules = await PLASMIC.fetchPages();
  return pageModules.map((mod) => {
    const catchall =
      mod.path === "/" ? undefined : mod.path.substring(1).split("/");
    return {
      catchall,
    };
  });
}

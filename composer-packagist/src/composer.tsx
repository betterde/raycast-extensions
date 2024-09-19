import {
  Icon,
  List,
  showToast,
  ToastStyle,
  ActionPanel,
  OpenInBrowserAction,
  CopyToClipboardAction,
} from "@raycast/api";
import { useMemo, useState } from "react";
import algoliaSearch from "algoliasearch/lite";

const INDEX = "packagist";
const APPID = "M58222SH95";
const APIKEY = "5ae4d03c98685bd7364c2e0fd819af05";

interface ItemAccessory {
  icon: Icon;
  text?: string;
  tooltip?: string;
}

type PackagistHitMeta = {
  favers: number;
  downloads: number;
  favers_formatted: string;
  downloads_formatted: string;
};

type PackagistHit = {
  id: number;
  name: string;
  type: string;
  meta: PackagistHitMeta;
  tags: string[];
  language: string;
  repository: string;
  trendiness: number;
  popularity: number;
  description: string;
  package_name: string;
  package_organisation: string;
};

function formatNumber(value: number): string {
  let formattedValue: string;

  if (value >= 1_000_000_000) {
      formattedValue = (value / 1_000_000_000).toFixed(2) + "B";
  } else if (value >= 1_000_000) {
      formattedValue = (value / 1_000_000).toFixed(2) + "M";
  } else if (value >= 1_000) {
      formattedValue = (value / 1_000).toFixed(2) + "K";
  } else {
      formattedValue = value.toString();
  }

  // Check if there is a decimal part, if so add a `+` sign
  if (formattedValue.includes('.')) {
      formattedValue += '+';
  }

  return formattedValue;
}

function getComposerRequireCommand(hit: PackagistHit) {
  return `composer require ${hit.name}`;
}

function getComposerRequireDevCommand(hit: PackagistHit) {
  return `composer require --dev ${hit.name}`;
}

function getPackagistPageURL(hit: PackagistHit) {
  return `https://packagist.org/packages/${hit.name}`;
}

export default function SearchDocumentation() {
  const algoliaClient = useMemo(() => {
    return algoliaSearch(APPID, APIKEY);
  }, [APPID, APIKEY]);

  const algoliaIndex = useMemo(() => {
    return algoliaClient.initIndex(INDEX);
  }, [algoliaClient, INDEX]);

  const [searchResults, setSearchResults] = useState<PackagistHit[] | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const search = async (query = "") => {
    setIsLoading(true);
    if (query == "") {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    try {
      const res = await algoliaIndex.search<PackagistHit>(query, {
        hitsPerPage: 30,
        facets: ["tags", "type", "type"],
      });
      setSearchResults(res.hits);
      setIsLoading(false);
    } catch (err: any) {
      setSearchResults([]);
      await showToast(ToastStyle.Failure, "Error Searching Composer Packagist.", err.message);
      setIsLoading(false);
    }
  };
  return (
    <List throttle={true} isLoading={isLoading} onSearchTextChange={search}>
      {searchResults?.map((hit: PackagistHit) => {
        return (
          <List.Item
            key={hit.id}
            icon="composer-icon.png"
            title={hit.name}
            subtitle={hit.description}
            actions={
              <ActionPanel title={hit.name}>
                <CopyToClipboardAction
                  content={getComposerRequireCommand(hit)}
                  title={"Copy Require Command"}
                />
                <CopyToClipboardAction
                  content={getComposerRequireDevCommand(hit)}
                  title={"Copy Require Dev Command"}
                />
                <OpenInBrowserAction
                  url={getPackagistPageURL(hit)}
                  title="Open Packagist in Browser"
                  shortcut={{ modifiers: ["cmd", "shift"], key: "return" }}
                />
                <OpenInBrowserAction
                  url={hit.repository}
                  title="Open Repository in Browser"
                  shortcut={{ modifiers: ["cmd", "opt", "shift"], key: "return" }}
                />
              </ActionPanel>
            }
            accessories={
              [
                {
                  text: formatNumber(hit.meta?.favers),
                  icon: Icon.Star,
                  tooltip: `${hit.meta?.favers} Stars`
                },
                {
                  text: formatNumber(hit.meta?.downloads),
                  icon: Icon.Download,  
                  tooltip: `${hit.meta?.downloads} Downloads`
                }
              ] as ItemAccessory[]
            }
          />
        );
      })}
    </List>
  );
}

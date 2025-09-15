import path from 'path';
import { getEnvMode } from './getEnvMode';
import fs from 'fs-extra';
import axios from 'axios';
import { cms } from './constants';
import { downloadImage, downloadVideo } from './downloadimages';
import { mkdir } from './mkdir-p';

export interface Welcome {
    data: Datum[];
    meta: Meta;
}

export interface Datum {
    id:          number;
    documentId:  string;
    createdAt:   Date;
    updatedAt:   Date;
    publishedAt: Date;
    posteri:     Content;
    videot:      Content[];
    tekstuuri:   Content;
}

export interface Content {
    id:                number;
    documentId:        string;
    name:              string;
    alternativeText:   null;
    caption:           null;
    width:             number | null;
    height:            number | null;
    formats:           null;
    hash:              string;
    ext:               string;
    mime:              string;
    size:              number;
    url:               string;
    previewUrl:        null;
    provider:          Provider;
    provider_metadata: null;
    createdAt:         Date;
    updatedAt:         Date;
    publishedAt:       Date;
}

export enum Provider {
    Local = "local",
}

export interface Meta {
    pagination: Pagination;
}

export interface Pagination {
    page:      number;
    pageSize:  number;
    pageCount: number;
    total:     number;
}

interface VideoInfo {
  url: string,
  width: number,
  format: string
}
export interface BannerData {
    videot: Array<VideoInfo>
    tekstuuri : string
    posteri: string
}

const cacheFolder = './public/banner';
await mkdir(cacheFolder)

const cacheFile = path.join(cacheFolder, 'banner-data.json');

export default async function fetchBanner(): Promise<BannerData> {
    
  const mode = getEnvMode();
    
  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cacheFile)) {
      const meta : BannerData = await fs.readJSON(cacheFile);
      return meta
    } else {
      console.warn('⚠️ some-meta.json missing in production/preview');
      return { videot : [], tekstuuri : "", posteri : "" };

    }
  }
    const response = await axios.get<Welcome>(`${cms}/api/bannerit?populate=*`);
    const data = response.data;
    let videoUrls : Array<VideoInfo> = []
    if (!data.data.length) {
      return { videot : [], tekstuuri : "", posteri : "" };
    }

    let content = data.data[0]

    let vids = content.videot
    for (let item of vids) {
        let url = `${cms}${item.url}`
        let vidUrl = await downloadVideo(url, item.hash+item.ext, "banner")
        let  width = parseInt(path.basename(vidUrl).split('x')[0])
        videoUrls.push({ url :  vidUrl, width : width, format: `video/${path.extname(vidUrl).slice(1)}` })
    }
    let tekstuuri = content.tekstuuri
    let texts = await downloadImage(`${cms}${tekstuuri.url}`, tekstuuri.hash+tekstuuri.ext, "banner")

    let posteri  = content.posteri
    let poster = await downloadImage(`${cms}${posteri.url}`, posteri.hash+posteri.ext, "banner")

    let bannnerData : BannerData = {
        videot : videoUrls,
        posteri : poster,
        tekstuuri: texts
    }
    await fs.writeJSON(cacheFile, bannnerData, { spaces: 2 })
    return bannnerData
}
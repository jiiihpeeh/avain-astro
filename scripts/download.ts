import returnGallery from '@/utils/gallerydl';
import favIconFetch from '@/utils/getheader';
import fetchSupporters from '@/utils/supporterfetch';
import fetchSocialMedia from "@/utils/fetchSome"
import {fetchPersonnel, fetchAddress} from '@/utils/fetchcontacts';
import fetchTervetuloa from "@/utils/fetchindex"
import fetchBackgroundGraphics from "@/utils/backgroundfetch"
import fetchLogoImage from "@/utils/fetchlogo"
import fetchMemberships from "@/utils/fetchMemberships"
import fetchNavbarData from "@/utils/navfetch"


await returnGallery();
await favIconFetch()

await fetchSupporters()
await fetchSocialMedia()

await fetchPersonnel();
await fetchAddress();
await fetchTervetuloa()

await fetchBackgroundGraphics()

await fetchLogoImage()

await fetchMemberships()

await fetchNavbarData()
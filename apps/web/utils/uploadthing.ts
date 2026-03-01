import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

type UploadthingHelpers = ReturnType<typeof generateReactHelpers<OurFileRouter>>;

const uploadthingHelpers: UploadthingHelpers = generateReactHelpers<OurFileRouter>();

type UploadFiles = UploadthingHelpers["uploadFiles"];
type UseUploadThing = UploadthingHelpers["useUploadThing"];

export const uploadFiles: UploadFiles = uploadthingHelpers.uploadFiles;

export const useUploadThing: UseUploadThing = uploadthingHelpers.useUploadThing;

/* @jsxImportSource react */

import { createUrl, pick } from "@acdh-oeaw/lib";
import { fields, NotEditable } from "@keystatic/core";
import { block, mark, wrapper } from "@keystatic/core/content-components";
import {
	Building2Icon,
	DownloadIcon,
	ImageIcon,
	PencilIcon,
	PlayIcon,
	ScanIcon,
	SuperscriptIcon,
	VideoIcon,
} from "lucide-react";

import { createAssetPaths } from "@/lib/content/create-asset-paths";
import { useObjectUrl } from "@/lib/content/use-object-url";

/** @see https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts */
export const calloutKinds = [
	{ label: "Caution", value: "caution" },
	{ label: "Important", value: "important" },
	{ label: "Note", value: "note" },
	{ label: "Tip", value: "tip" },
	{ label: "Warning", value: "warning" },
] as const;

export const figureAlignments = [
	{ label: "Center", value: "center" },
	{ label: "Stretch", value: "stretch" },
] as const;

export const gridVariants = [
	{ label: "Two columns", value: "two-columns" },
	{ label: "Three columns", value: "three-columns" },
	{ label: "Four columns", value: "four-columns" },
	{ label: "Two columns, right is 2x as wide", value: "one-two-columns" },
	{ label: "Two columns, right is 3x as wide", value: "one-three-columns" },
	{ label: "Two columns, right is 4x as wide", value: "one-four-columns" },
] as const;

export const linkCollections = [
	{ label: "Download", value: "download" },
	{ label: "External URL", value: "external" },
	{ label: "Pages", value: "pages" },
] as const;

export const videoProviders = [{ label: "YouTube", value: "youtube" }] as const;

function create(
	assetPath: `/${string}/`,
	components?: Array<
		"AudioPlayer" | "Download" | "Embed" | "Figure" | "Footnote" | "TranskriptionsTool" | "Video"
	>,
) {
	const allComponents = {
		AudioPlayer: block({
			label: "AudioPlayer",
			description: "An audio player with playlist.",
			icon: <PlayIcon />,
			schema: {
				tracks: fields.array(
					fields.object(
						{
							title: fields.text({
								label: "Title",
								validation: { isRequired: true },
							}),
							file: fields.file({
								label: "File",
								...createAssetPaths(assetPath),
								validation: { isRequired: true },
							}),
						},
						{
							label: "Track",
						},
					),
					{
						label: "Tracks",
						itemLabel(props) {
							return props.fields.title.value;
						},
					},
				),
			},
			ContentView(props) {
				return (
					<div>
						<ul>
							{props.value.tracks.map((track, index) => {
								return (
									<li key={index}>
										<div>{track.title}</div>
									</li>
								);
							})}
						</ul>
					</div>
				);
			},
		}),
		Download: mark({
			label: "Download",
			// description: "A link to an uploaded file.",
			tag: "a",
			className: "underline decoration-dotted",
			icon: <DownloadIcon />,
			schema: {
				href: fields.file({
					label: "File",
					...createAssetPaths(assetPath),
					validation: { isRequired: true },
				}),
			},
		}),
		Embed: wrapper({
			label: "Embed",
			description: "Another website embedded via iframe",
			icon: <ScanIcon />,
			schema: {
				href: fields.image({
					label: "Image",
					...createAssetPaths(assetPath),
					validation: { isRequired: true },
				}),
				caption: fields.text({
					label: "Caption",
					// validation: { isRequired: false },
				}),
			},
		}),
		Figure: wrapper({
			label: "Figure",
			description: "An image with caption.",
			icon: <ImageIcon />,
			schema: {
				href: fields.image({
					label: "Image",
					...createAssetPaths(assetPath),
					validation: { isRequired: true },
				}),
				alt: fields.text({
					label: "Image description for screen readers",
					// validation: { isRequired: false },
				}),
			},
		}),
		Footnote: mark({
			label: "Footnote",
			icon: <SuperscriptIcon />,
			className: "underline decoration-dotted align-super text-sm",
			schema: {},
		}),
		Organisation: block({
			label: "Organisation",
			description: "Add organisation info with optional logo and link.",
			icon: <Building2Icon />,
			schema: {
				name: fields.text({
					label: "Name",
					validation: { isRequired: true },
				}),
				address: fields.text({
					label: "Address",
					validation: { isRequired: false },
					multiline: true,
				}),
				website: fields.url({
					label: "Website",
					validation: { isRequired: false },
				}),
				phone: fields.text({
					label: "Phone",
					validation: { isRequired: false },
				}),
				email: fields.url({
					label: "Email",
					validation: { isRequired: false },
				}),
				logo: fields.image({
					label: "Logo",
					validation: { isRequired: false },
					...createAssetPaths(assetPath),
				}),
			},
			ContentView(props) {
				const { name, address, website, phone, email, logo } = props.value;

				const src = useObjectUrl(logo);

				return (
					<NotEditable className="flex flex-col gap-y-2">
						<div>{src ? <img alt="" src={src} /> : null}</div>
						<div className="flex flex-col gap-y-0.5">
							<strong className="font-semibold">{name}</strong>
							{address ? <div>{address}</div> : null}
							{phone ? (
								<div>
									Tel.: <a href={`tel:${phone}`}>{phone}</a>
								</div>
							) : null}
							{email ? (
								<div>
									Email: <a href={`mailto:${email}`}>{email}</a>
								</div>
							) : null}
							{website ? (
								<div>
									Website: <a href={website}>{website}</a>
								</div>
							) : null}
						</div>
					</NotEditable>
				);
			},
		}),
		TranskriptionsTool: block({
			label: "TranskriptionsTool",
			description: "A Transkribus embed.",
			icon: <PencilIcon />,
			schema: {},
		}),
		Video: block({
			label: "Video",
			description: "An embedded video.",
			icon: <VideoIcon />,
			schema: {
				provider: fields.select({
					label: "Video provider",
					options: [
						{
							label: "YouTube",
							value: "youtube",
						},
					],
					defaultValue: "youtube",
				}),
				id: fields.text({
					label: "Video ID",
					validation: { isRequired: true },
				}),
				caption: fields.text({
					label: "Caption",
					// validation: { isRequired: false },
				}),
			},
			ContentView(props) {
				const { caption, id } = props.value;

				const href = String(
					createUrl({
						baseUrl: "https://www.youtube-nocookie.com",
						pathname: `/embed/${id}`,
					}),
				);

				return (
					<div>
						<figure>
							<iframe allowFullScreen={true} src={href} title="Video" />
							{caption ? <figcaption>{caption}</figcaption> : null}
						</figure>
					</div>
				);
			},
		}),
	};

	if (components == null) return allComponents;

	return pick(allComponents, components);
}

type Components = ReturnType<typeof create>;

export function createComponents(assetPath: `/${string}/`, include?: Array<keyof Components>) {
	const components = create(assetPath);
	return include ? pick(components, include) : components;
}

export const headingLevels = [2, 3, 4, 5] as const;

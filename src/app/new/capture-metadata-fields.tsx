type CaptureMetadataFieldsProps = {
  collectionPlaceholder: string;
  tagsPlaceholder: string;
};

export function CaptureMetadataFields({
  collectionPlaceholder,
  tagsPlaceholder,
}: CaptureMetadataFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2">
        <span className="field-label">Tags</span>
        <input className="field" name="tags" placeholder={tagsPlaceholder} />
      </label>

      <label className="grid gap-2">
        <span className="field-label">Collection</span>
        <input
          className="field"
          name="collection"
          placeholder={collectionPlaceholder}
        />
      </label>
    </div>
  );
}

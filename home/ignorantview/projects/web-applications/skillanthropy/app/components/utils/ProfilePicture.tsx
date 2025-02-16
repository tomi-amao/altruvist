type ProfilePictureProps = {
  src: string;

  alt: string;

  size: number;

  minSize?: number;

  maxSize?: number;
};

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  src,
  alt,
  size,
  minSize = 50,
  maxSize = 150,
}) => {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: "100%",
        maxWidth: maxSize,
        minWidth: minSize,
        height: "auto",
        aspectRatio: "1 / 1",
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  );
};

export default ProfilePicture;

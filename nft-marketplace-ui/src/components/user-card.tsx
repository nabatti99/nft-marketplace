import { Mail, Phone, Globe, MapPin, Briefcase } from "lucide-react";
import { Avatar, Card, CardBody, CardHeader, Tooltip } from "@heroui/react";

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
};

interface UserCardProps {
  user: User;
}

export default function UserCard({ user }: UserCardProps): JSX.Element {
  return (
    <Card className="mx-auto w-full max-w-xs">
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Avatar
            fallback={user.name
              .split(" ")
              .map(n => n[0])
              .join("")}
            className="size-10"
          ></Avatar>
          <div>
            <h1 className="text-base">{user.name}</h1>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="grid grid-cols-2 gap-2 text-sm">
        <Tooltip
          content={
            <div className="flex items-center">
              <Mail className="mr-1 size-3" />
              <span className="truncate">{user.email}</span>
            </div>
          }
        >
          <p>{user.email}</p>
        </Tooltip>
        <Tooltip
          content={
            <div className="flex items-center">
              <Phone className="mr-1 size-3" />
              <span className="truncate">{user.phone}</span>
            </div>
          }
        >
          <p>{user.phone}</p>
        </Tooltip>
        <Tooltip
          content={
            <div className="flex items-center">
              <Globe className="mr-1 size-3" />
              <span className="truncate">{user.website}</span>
            </div>
          }
        >
          <p>{user.website}</p>
        </Tooltip>
        <Tooltip
          content={
            <div className="flex items-center">
              <MapPin className="mr-1 size-3" />
              <span className="truncate">{`${user.address.street}, ${user.address.city}`}</span>
            </div>
          }
        >
          <p>{user.address.city}</p>
        </Tooltip>
        <Tooltip
          content={
            <div className="col-span-2">
              <p>{user.company.name}</p>
              <p className="text-xs text-muted-foreground">{user.company.catchPhrase}</p>
            </div>
          }
        >
          <div className="col-span-2 flex items-center">
            <Briefcase className="mr-1 size-3" />
            <span className="truncate">{user.company.name}</span>
          </div>
        </Tooltip>
      </CardBody>
    </Card>
  );
}

import { Button } from "@chakra-ui/button";
import { Box, Flex } from "@chakra-ui/layout";
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trans } from "@lingui/macro";
import { Suggestions } from "app/plus/service";
import MyLink from "components/common/MyLink";
import SubText from "components/common/SubText";
import UserAvatar from "components/common/UserAvatar";
import { useMyTheme } from "hooks/common";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { getToastOptions } from "utils/getToastOptions";
import { getVotingRange } from "utils/plus";
import { getFullUsername } from "utils/strings";
import { trpc } from "utils/trpc";
import { Unpacked } from "utils/types";
import {
  resuggestionSchema,
  SUGGESTION_DESCRIPTION_LIMIT,
} from "utils/validators/suggestion";
import * as z from "zod";

type FormData = z.infer<typeof resuggestionSchema>;

const Suggestion = ({
  suggestion,
  canSuggest,
}: {
  suggestion: Unpacked<Suggestions>;
  canSuggest: boolean;
}) => {
  const toast = useToast();
  const { gray } = useMyTheme();
  const [showTextarea, setShowTextarea] = useState(false);
  const { handleSubmit, errors, register, watch } = useForm<FormData>({
    resolver: zodResolver(resuggestionSchema),
  });
  const utils = trpc.useQueryUtils();

  const { mutate, status } = trpc.useMutation("plus.suggestion", {
    onSuccess() {
      toast(getToastOptions("Comment added", "success"));
      // TODO:
      utils.invalidateQuery(["plus.suggestions"]);
      setShowTextarea(false);
    },
    onError(error) {
      toast(getToastOptions(error.message, "error"));
    },
  });

  const watchDescription = watch("description", "");

  return (
    <Box as="section" my={8}>
      <Flex alignItems="center" fontWeight="bold" fontSize="1.25rem">
        <UserAvatar user={suggestion.suggestedUser} mr={3} />
        <MyLink
          href={`/u/${suggestion.suggestedUser.discordId}`}
          isColored={false}
        >
          {getFullUsername(suggestion.suggestedUser)}
        </MyLink>
      </Flex>
      <Box>
        <Box fontSize="sm" color={gray} mt={2}>
          {new Date(suggestion.createdAt).toLocaleString()}
        </Box>
        <SubText mt={2}>+{suggestion.tier}</SubText>
        <Box mt={4} fontSize="sm">
          "{suggestion.description}" -{" "}
          <MyLink
            href={`/u/${suggestion.suggesterUser.discordId}`}
            isColored={false}
          >
            {getFullUsername(suggestion.suggesterUser)}
          </MyLink>
        </Box>
        {suggestion.resuggestions?.map((resuggestion) => {
          return (
            <Box key={resuggestion.suggesterUser.id} mt={4} fontSize="sm">
              "{resuggestion.description}" -{" "}
              <MyLink
                href={`/u/${resuggestion.suggesterUser.discordId}`}
                isColored={false}
              >
                {getFullUsername(resuggestion.suggesterUser)}
              </MyLink>
            </Box>
          );
        })}
        {canSuggest && !showTextarea && !getVotingRange().isHappening && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTextarea(!showTextarea)}
            mt={4}
            data-cy="comment-button"
          >
            Add comment
          </Button>
        )}
        {showTextarea && (
          <form
            onSubmit={handleSubmit((values) =>
              mutate({
                ...values,
                // region doesn't matter as it is not updated after the first suggestion
                region: "NA",
                tier: suggestion.tier,
                suggestedId: suggestion.suggestedUser.id,
              })
            )}
          >
            <FormControl isInvalid={!!errors.description}>
              <FormLabel htmlFor="description" mt={4}>
                Comment to suggestion
              </FormLabel>
              <Textarea
                name="description"
                ref={register}
                data-cy="comment-textarea"
              />
              <FormHelperText mb={4}>
                {(watchDescription ?? "").length}/{SUGGESTION_DESCRIPTION_LIMIT}
              </FormHelperText>
              <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
            </FormControl>
            <Button
              size="sm"
              mr={3}
              type="submit"
              isLoading={status === "loading"}
              data-cy="submit-button"
            >
              <Trans>Save</Trans>
            </Button>
            <Button
              size="sm"
              onClick={() => setShowTextarea(false)}
              variant="outline"
            >
              <Trans>Cancel</Trans>
            </Button>
          </form>
        )}
      </Box>
    </Box>
  );
};

export default Suggestion;

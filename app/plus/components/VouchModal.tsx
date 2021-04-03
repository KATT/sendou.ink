import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  useToast,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import UserSelector from "components/common/UserSelector";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { getToastOptions } from "utils/getToastOptions";
import { trpc } from "utils/trpc";
import { vouchSchema } from "utils/validators/vouch";
import * as z from "zod";

interface Props {
  canVouchFor: number;
}

type FormData = z.infer<typeof vouchSchema>;

const VouchModal: React.FC<Props> = ({ canVouchFor }) => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { handleSubmit, errors, register, control } = useForm<FormData>({
    resolver: zodResolver(vouchSchema),
  });
  const utils = trpc.useQueryUtils();
  const { mutate, status } = trpc.useMutation("plus.vouch", {
    onSuccess() {
      toast(getToastOptions("Successfully vouched", "success"));
      utils.invalidateQuery(["plus.statuses"]);
      setIsOpen(false);
    },
    onError(error) {
      toast(getToastOptions(error.message, "error"));
    },
  });

  return (
    <>
      <Button
        size='sm'
        mb={4}
        ml={2}
        onClick={() => setIsOpen(true)}
        data-cy='vouch-button'
      >
        Vouch
      </Button>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          size='xl'
          closeOnOverlayClick={false}
        >
          <ModalOverlay>
            <ModalContent>
              <ModalHeader>Vouching</ModalHeader>
              <ModalCloseButton borderRadius='50%' />
              <form onSubmit={handleSubmit((data) => mutate(data))}>
                <ModalBody pb={2}>
                  <FormLabel>Tier</FormLabel>
                  <Controller
                    name='tier'
                    control={control}
                    defaultValue={canVouchFor}
                    render={({ value, onChange }) => (
                      <Select
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                      >
                        {canVouchFor === 1 && <option value='1'>+1</option>}
                        {canVouchFor <= 2 && <option value='2'>+2</option>}
                        <option value='3'>+3</option>
                      </Select>
                    )}
                  />

                  <FormControl isInvalid={!!errors.vouchedId}>
                    <FormLabel mt={4}>User</FormLabel>
                    <Controller
                      name='vouchedId'
                      control={control}
                      render={({ value, onChange }) => (
                        <UserSelector
                          value={value}
                          setValue={onChange}
                          isMulti={false}
                          maxMultiCount={undefined}
                        />
                      )}
                    />
                    <FormErrorMessage>
                      {errors.vouchedId?.message}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl>
                    <FormLabel mt={4}>Region</FormLabel>
                    <Select
                      name='region'
                      ref={register}
                      data-cy='region-select'
                    >
                      <option value='NA'>NA</option>
                      <option value='EU'>EU</option>
                    </Select>
                    <FormHelperText>
                      If the player isn't from either region then choose the one
                      they play most commonly with.
                    </FormHelperText>
                  </FormControl>
                </ModalBody>
                <ModalFooter>
                  <Button
                    mr={3}
                    type='submit'
                    isLoading={status === "loading"}
                    data-cy='submit-button'
                  >
                    Save
                  </Button>
                  <Button onClick={() => setIsOpen(false)} variant='outline'>
                    Cancel
                  </Button>
                </ModalFooter>
              </form>
            </ModalContent>
          </ModalOverlay>
        </Modal>
      )}
    </>
  );
};

export default VouchModal;
